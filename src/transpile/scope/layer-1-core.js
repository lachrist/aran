"use strict";

// data Scope a b c
//   = StaticScope {
//       parent :: (Scope a b c),
//       variables :: [Variable b] }
//   | DynamicScope {
//       parent :: (Scope a b c),
//       data :: a }
//   | AuxiliarScope {
//       parent :: (Scope a b c),
//       key :: String,
//       value ::  c }
//   | ClosureScope {
//       parent :: (Scope a b c) }
//   | RootScope

// data Variable b
//   = GhostVariable {
//       name :: Identifier,
//       data :: b }
//   | ShadowVariable {
//       name :: Identifier }
//   | NormalVariable {
//       name :: Identifier,
//       initialized :: Maybe Bool,
//       deadzone :: Bool,
//       data :: b }

// No imposed order on the frame.

// Invariant hypothesis: `scope` is a black box outside this module.
//
// type Kind = normalize.scope.outer.Kind
//
// type Identifier = normalize.scope.stratum.StratifiedIdentifier
// type MetaIdentifier = normalize.scope.stratum.MetaStratifiedIdentifier
// type BaseIdentifier = normalize.scope.stratum.BaseStratifiedIdentifier
// type StratifiedIdentifier = normalize.scope.stratum.StratifiedStratifiedIdentifier
//
// type Statement = aran.lang.Statement
// type Expression = aran.lang.Expression
// type Parameter = aran.lang.Parameter
//
// type Scope = Maybe (Parent, Frame)
// type Parent = Scope
// type Frame = Either MarkerFrame (Either StaticFrame DynamicFrame)
//
// type MarkerFrame = Either UseStrictMarkerFrame ClosureMarkerFrame EvalMarkerFrame
// type UseStrictMarkerFrame = ()
// type ClosureMarkerFrame = ()
// type EvalMarkerFrame = ()
//
// type DynamicFrame = Base.DynamicFrame
// type StaticFrame = (Mutable, Map Identifier Binding)
// type Mutable = Boolean
// type Binding = Maybe (Initialized, HasDynamicDeadzone, Tag)
// type Initialized = Boolean
// type HasDynamicDeadzone = Boolean
// type Tag = Outer.Tag
// type Counter = Number

const global_JSON_parse = global.JSON.parse;
const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Identifier = require("../../identifier.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");

const ROOT_SCOPE = null;

const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const PROPERTY_SCOPE_TYPE = "binding";
const CLOSURE_SCOPE_TYPE = "closure";
const EMPTY_SCOPE_TYPE = "empty";

const GHOST_VARIABLE_TYPE = "ghost";
const SHADOW_VARIABLE_TYPE = "shadow";
const NORMAL_VARIABLE_TYPE = "normal";

// Distant initialization is required for normalizing switch blocks:
//
// switch (x) {
//   case y: let foo = 123;
//   case z: foo;
// }
//
// {
//   let foo;
//   let _discriminant = x;
//   let _matched = false;
//   if (_matched ? true : _discriminant === y) {
//     _matched = true;
//     foo = 123; // distant initialization
//   }
//   if (_matched ? true : _discriminant === y) {
//     _matched = true;
//     foo; // dynamic deadzone
//   }
// }

// Usage for ghost variables:
//   - Shadowing variables for for-in & for-of loops:
//     for (let x in x) { 123; }
//     >> {
//     >>   // let x; (ghosted out)
//     >>   const target = ((() => { throw new ReferenceError("Deadzone") }) ());
//     >>   const keys = ...;
//     >>   const length = keys.length;
//     >>   let index = 0;
//     >>   while (index < length) {
//     >>     let x = keys[index];
//     >>     { 123; } } }
//   - Imports

const getBindingScope = (scope) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_SCOPE_TYPE || scope.type === STATIC_SCOPE_TYPE) {
      return scope;
    }
    Throw.assert(scope.type !== CLOSURE_SCOPE_TYPE, null, `Closure scope hit for getBindingScope`);
    // console.assert(scope.type === PROPERTY_SCOPE_TYPE || scope.type === EMPTY_SCOPE_TYPE)
    scope = scope.parent;
  }
  return ROOT_SCOPE;
};

const isBindingScopeDistant = (scope) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_SCOPE_TYPE || scope.type === STATIC_SCOPE_TYPE) {
      return false;
    }
    Throw.assert(scope.type !== CLOSURE_SCOPE_TYPE, null, `Closure scope hit for isBindingScopeDistant`);
    if (scope.type === EMPTY_SCOPE_TYPE) {
      return true;
    }
    // console.assert(scope.type === PROPERTY_SCOPE_TYPE)
    scope = scope.parent;
  }
  return false;
};

const hasVariable = (variables, identifier) => {
  for (let index = 0; index < variables.length; index++) {
    if (variables[index].name === identifier) {
      return true;
    }
  }
  return false;
};

const getVariable = (variables, identifier) => {
  for (let index = 0; index < variables.length; index++) {
    if (variables[index].name === identifier) {
      return variables[index];
    }
  }
  Throw.abort(null, `Missing static variable`);
};

////////////
// Extend //
////////////

exports.RootScope = () => ROOT_SCOPE;

exports.ClosureScope = (parent) => ({
  type: CLOSURE_SCOPE_TYPE,
  parent: parent
});

exports.PropertyScope = (parent, key, value) => ({
  type: PROPERTY_SCOPE_TYPE,
  parent: parent,
  key: key,
  value: value
});

exports.DynamicScope = (parent, data) => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent: parent,
  data: data
});

exports.makeEmptyBlock = (parent, callback) => Tree.__Block__([], callback({
  type: EMPTY_SCOPE_TYPE,
  parent: parent
}));

exports.makeBlock = (parent, callback) => {
  const scope = {
    type: STATIC_SCOPE_TYPE,
    parent: parent,
    variables: []
  };
  const statement = callback(scope);
  const statements = [];
  const identifiers = [];
  for (let index = 0; index < scope.variables.length; index++) {
    const variable = scope.variables[index];
    if (variable.type === NORMAL_VARIABLE_TYPE) {
      Throw.assert(variable.initialized !== false, null, `Non initialized normal variable`);
      identifiers[identifiers.length] = Identifier.makeBase(variable.name);
      if (variable.deadzone) {
        identifiers[identifiers.length] = Identifier.makeMeta(variable.name);
        statements[statements.length] = Tree.ExpressionStatement(Tree.__WriteExpression__(Identifier.makeMeta(variable.name), Tree.PrimitiveExpression(false)));
      }
    }
  }
  statements[statements.length] = statement;
  return Tree.__Block__(identifiers, Tree.ListStatement(statements));
};

/////////////////
// getProperty //
/////////////////

exports.getPropertyValue = (scope, key) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === PROPERTY_SCOPE_TYPE && scope.key === key) {
      return scope.value;
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Missing scope property`);
};

///////////////////////////
// Declare && Initialize //
///////////////////////////

exports.isStatic = (scope) => {
  scope = getBindingScope(scope);
  return scope !== ROOT_SCOPE && scope.type === STATIC_SCOPE_TYPE;
};

exports.isDynamic = (scope) => {
  scope = getBindingScope(scope);
  return scope !== ROOT_SCOPE && scope.type === DYNAMIC_SCOPE_TYPE;
};

exports.isRoot = (scope) => {
  return getBindingScope(scope) === ROOT_SCOPE;
};

exports.getDynamicFrame = (scope) => {
  scope = getBindingScope(scope);
  Throw.assert(scope !== ROOT_SCOPE && scope.type === DYNAMIC_SCOPE_TYPE, null, `Expected a dynamic frame`);
  return scope.data;
};

exports.getStaticData = (scope, identifier) => {
  scope = getBindingScope(scope);
  Throw.assert(scope !== ROOT_SCOPE && scope.type === STATIC_SCOPE_TYPE, null, `Expected a static frame`);
  const variable = getVariable(scope.variables, identifier);
  Throw.assert(variable.type !== SHADOW_VARIABLE_TYPE, null, `Cannot get the static data of a shadow variable`);
  return variable.data;
};

exports.declareStaticVariable = (scope, identifier, ghost, data) => {
  scope = getBindingScope(scope);
  Throw.assert(scope !== ROOT_SCOPE && scope.type === STATIC_SCOPE_TYPE, null, `Expected a static frame`);
  Throw.assert(!hasVariable(scope.variables, identifier), null, `Duplicate static variable declaration`);
  scope.variables[scope.variables.length] = ghost ? {
    type: GHOST_VARIABLE_TYPE,
    name: identifier,
    data: data
  } : {
    type: NORMAL_VARIABLE_TYPE,
    name: identifier,
    deadzone: false,
    initialized: false,
    data: data
  };
};

exports.makeStaticInitializeExpression = (scope, identifier, expression) => {
  const distant = isBindingScopeDistant(scope);
  scope = getBindingScope(scope);
  Throw.assert(scope !== ROOT_SCOPE && scope.type === STATIC_SCOPE_TYPE, null, `Expected a static frame`);
  const variable = getVariable(scope.variables, identifier);
  Throw.assert(variable.type === NORMAL_VARIABLE_TYPE, null, `Expected a normal variable`);
  Throw.assert(variable.initialized === false, null, `Duplicate variable initialization`);
  variable.initialized = distant ? null : true;
  variable.deadzone = variable.deadzone || distant;
  expression = Tree.__WriteExpression__(Identifier.makeBase(identifier), expression);
  if (variable.deadzone) {
    expression = Tree.SequenceExpression(expression, Tree.__WriteExpression__(Identifier.makeMeta(identifier), Tree.PrimitiveExpression(true)));
  }
  return expression;
};

//////////////////////////
// makeLookupExpression //
//////////////////////////

const lookup = (scope, identifier, callbacks, frames) => {
  for (let escaped = false; scope !== ROOT_SCOPE; scope = scope.parent) {
    if (scope.type === PROPERTY_SCOPE_TYPE) {
      continue;
    }
    if (scope.type === EMPTY_SCOPE_TYPE) {
      continue;
    }
    if (scope.type === CLOSURE_SCOPE_TYPE) {
      escaped = true;
      continue;
    }
    if (scope.type === DYNAMIC_SCOPE_TYPE) {
      frames[frames.length] = scope.data;
      continue;
    }
    // console.assert(scope.type === STATIC_SCOPE_TYPE);
    if (hasVariable(scope.variables, identifier)) {
      const variable = getVariable(scope.variables, identifier);
      if (variable.type === SHADOW_VARIABLE_TYPE) {
        continue;
      }
      if (variable.type === GHOST_VARIABLE_TYPE) {
        return callbacks.onStaticDeadHit(variable.data);
      }
      // console.assert(variable.type === NORMAL_VARIABLE_TYPE);
      if (variable.initialized === false && !escaped) {
        return callbacks.onStaticDeadHit(variable.data);
      }
      const read = () => Tree.__ReadExpression__(Identifier.makeBase(identifier));
      const write = (expression) => Tree.__WriteExpression__(Identifier.makeBase(identifier), expression);
      if (variable.initialized === true) {
        return callbacks.onStaticLiveHit(variable.data, read, write);
      }
      variable.deadzone = true;
      const expression1 = Tree.__ReadExpression__(Identifier.makeMeta(identifier));
      const expression2 = callbacks.onStaticLiveHit(variable.data, read, write)
      const expression3 = callbacks.onStaticDeadHit(variable.data);
      return Tree.ConditionalExpression(expression1, expression2, expression3);
    }
    scope.variables[scope.variables.length] = {
      type: SHADOW_VARIABLE_TYPE,
      name: identifier
    };
  }
  return callbacks.onMiss();
}

exports.makeLookupExpression = (scope, identifier, callbacks) => {
  const frames = [];
  let expression = lookup(scope, identifier, callbacks, frames);
  for (let index = frames.length - 1; index >= 0; index--) {
    expression = callbacks.onDynamicFrame(expression, frames[index]);
  }
  return expression;
};

/////////////////////////
// makeInputExpression //
/////////////////////////

exports.makeInputExpression = (scope, parameter) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_SCOPE_TYPE) {
      return Intrinsic.makeGetExpression(Tree.__ReadExpression__("input"), Tree.PrimitiveExpression(parameter), null);
    }
    Throw.assert(scope.type === PROPERTY_SCOPE_TYPE, null, `Invalid scope for input expression`);
    scope = scope.parent;
  }
  Throw.abort(null, `Missing scope for input expression`);
};

////////////////////////
// makeEvalExpression //
////////////////////////

exports.makeEvalExpression = (scope, enclave, expression) => {
  const variables = [];
  let escaped = false;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === CLOSURE_SCOPE_TYPE) {
      escaped = true;
    } else if (scope.type === STATIC_SCOPE_TYPE) {
      for (let index = 0; index < scope.variables.length; index++) {
        const variable = scope.variables[index];
        if (!hasVariable(variables, variable.name)) {
          variables[variables.length] = variable;
          if (variable.type === NORMAL_VARIABLE_TYPE && variable.initialized === false && escaped) {
            variable.deadzone = true;
          }
        }
      }
    }
    scope = scope.parent;
  }
  const identifiers = [];
  for (let index = 0; index < variables.length; index++) {
    const variable = variables[index];
    if (variable.type === NORMAL_VARIABLE_TYPE) {
      identifiers[identifiers.length] = Identifier.makeBase(variable.name);
      if (variable.deadzone) {
        identifiers[identifiers.length] = Identifier.makeMeta(variable.name);
      }
    }
  }
  return Tree.__EvalExpression__(enclave, identifiers, expression);
};
