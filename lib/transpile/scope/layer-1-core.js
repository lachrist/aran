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
const Variable = require("../../variable.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");

const ROOT_SCOPE = null;

const DYNAMIC_SCOPE_TYPE = "dynamic";
const STATIC_SCOPE_TYPE = "static";
const AUXILIAR_SCOPE_TYPE = "binding";
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

////////////
// Extend //
////////////

exports.RootScope = () /* -> Scope */ => ROOT_SCOPE;

exports.ClosureScope = (parent) /* -> Scope */ => ({
  type: CLOSURE_SCOPE_TYPE,
  parent: parent
});

exports.AuxiliarScope = (parent, key, value) /* Scope */ => ({
  type: AUXILIAR_SCOPE_TYPE,
  parent: parent,
  key: key,
  value: value
});

exports.DynamicScope = (parent, data)  /* -> Scope */ => ({
  type: DYNAMIC_SCOPE_TYPE,
  parent: parent,
  data: data
});

exports.makeEmptyBlock = (parent, callback) => Tree.__BLOCK__([], callback({
  type: EMPTY_SCOPE_TYPE,
  parent: parent
}));

// type Callback = Scope -> [AranStatement]
exports.makeBlock = (parent, callback) /* -> Block */ => {
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
      Throw.assert(variable.initialized !== false, null, `Non initialized normal variable ${identifier}`);
      identifiers[identifiers.length] = Variable.Base(variable.name);
      if (variable.deadzone) {
        identifiers[identifiers.length] = Variable.Meta(variable.name);
        statements[statements.length] = Tree.ExpressionStatement(Tree.__WriteExpression__(Variable.Meta(variable.name), Tree.PrimitiveExpression(false)));
      }
    }
  }
  statements[statements.length] = statement;
  return Tree.__Block__(identifiers, Tree.ListStatement(statements));
};

///////////////////////////
// Declare && Initialize //
///////////////////////////

const getBindingScope = (scope) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type !== EMPTY_SCOPE_TYPE && scope.type !== AUXILIAR_SCOPE_TYPE) {
      return scope;
    }
    scope = scope.parent;
  }
  return scope;
};

const isBindingScopeDistant = (scope) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === EMPTY_SCOPE_TYPE) {
      return true;
    }
    if (scope.type !== AUXILIAR_SCOPE_TYPE) {
      return false;
    }
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

exports.isStatic = (scope) => (
  scope = getBindingScope(scope),
  (
    scope !== ROOT_SCOPE &&
    scope.type === STATIC_SCOPE_TYPE));

exports.isDynamic = (scope) => (
  scope = getBindingScope(scope),
  (
    scope !== ROOT_SCOPE &&
    scope.type === DYNAMIC_SCOPE_TYPE));

exports.isRoot = (scope) => getBindingScope(scope) === ROOT_SCOPE;

exports.getDynamicData = (scope) => (
  scope = getBindingScope(scope),
  Throw.assert(
    (
      scope !== ROOT_SCOPE &&
      scope.type === DYNAMIC_SCOPE_TYPE),
    null,
    `Expected a dynamic frame`),
  scope.data);

exports.getStaticData = (scope, identifier, _variable) => (
  scope = getBindingScope(scope),
  Throw.assert(
    (
      scope !== ROOT_SCOPE &&
      scope.type === STATIC_SCOPE_TYPE),
    null,
    `Expected a static frame`),
  _variable = getVariable(scope.variables, identifier),
  Throw.assert(
    _variable.type !== SHADOW_VARIABLE_TYPE,
    null,
    `Cannot get the static data of a shadow variable`),
  _variable.data);

exports.declareStatic = (scope, identifier, ghost, data) => (
  scope = getBindingScope(scope),
  Throw.assert(
    (
      scope !== ROOT_SCOPE &&
      scope.type === STATIC_SCOPE_TYPE),
    null,
    `Expected a static frame`),
  Throw.assert(
    !hasVariable(scope.variables, identifier),
    null,
    `Duplicate static variable declaration`),
  scope.variables[scope.variables.length] = (
    ghost ?
    {
      type: GHOST_VARIABLE_TYPE,
      name: identifier,
      data: data} :
    {
      type: NORMAL_VARIABLE_TYPE,
      name: identifier,
      deadzone: false,
      initialized: false,
      data: data});
  null);

exports.makeStaticInitializeExpression = (scope, identifier, expression, _distant, _variable) => (
  _distant = isBindingScopeDistant(scope),
  scope = getBindingScope(scope),
  Throw.assert(
    (
      scope !== ROOT_SCOPE &&
      scope.type === STATIC_SCOPE_TYPE),
    null,
    `Expected a static frame`),
  _variable = getVariable(scope.variables, identifier),
  Throw.assert(_variable.type === NORMAL_VARIABLE_TYPE, null, `Expected a normal variable`),
  Throw.assert(_variable.initialized === false, null, `Duplicate variable initialization`),
  // console.assert(_variable.deadzone === false)
  _variable.initialized = _distant ? null : true,
  _variable.deadzone = _distant,
  Tree.__WriteExpression__(
    Variable.Base(identifier),
    expression));

//////////////////////////
// makeLookupExpression //
//////////////////////////

const lookup = (scope, identifier, callbacks, escaped, _variable) => (
  scope === ROOT_SCOPE ?
  callbacks.onMiss() :
  (
    (
      scope.type === AUXILIAR_SCOPE_TYPE ||
      scope.type === EMPTY_SCOPE_TYPE) ?
    lookup(scope.parent, identifier, callbacks, escaped) :
    (
      scope.type === CLOSURE_SCOPE_TYPE ?
      lookup(scope.parent, identifier, callbacks, true) :
      (
        scope.type === DYNAMIC_SCOPE_TYPE ?
        callbacks.onDynamicFrame(
          scope.data,
          lookup(scope.parent, identifier, callbacks, escaped)) :
        // console.assert(scope.type === STATIC_SCOPE_TYPE)
        (
          ArrayLite.some(
            scope.variables,
            (variable) => variable.name === identifier) ?
          (
            _variable = ArrayLite.find(
              scope.variables,
              (variable) => variable.name === identifier),
            (
              _variable.type == SHADOW_VARIABLE_TYPE ?
              lookup(scope.parent, identifier, callbacks, escaped) :
              (
                _variable.type == GHOST_VARIABLE_TYPE ?
                callbacks.onStaticDeadHit(_variable.data) :
                // console.assert(_variable.type === NORMAL_VARIABLE_TYPE)
                (
                  (
                    _variable.initialized === false &&
                    !escaped) ?
                  callbacks.onStaticDeadHit(_variable.data) :
                  (
                    _read = () => Tree.__ReadExpression__(
                        Variable.Base(identifier)),
                    _write = (expression) => Tree.__WriteExpression__(
                      Variable.Base(identifier),
                      expression),
                    (
                      _variable.initialized === true ?
                      callbacks.onStaticLiveHit(_variable.data, _read, _write) :
                      Tree.ConditionalExpression(
                        Tree.__ReadExpression__(
                          Variable.Meta(identifier)),
                        callbacks.onStaticLiveHit(_variable.data, _read, _write),
                        callbacks.onStaticDeadHit(_variable.data)))))))) :
          (
            scope.variables[scope.variables.length] = {
              type: SHADOW_VARIABLE_TYPE,
              name: identifier},
            lookup(scope.parent, identifier, callbacks, escaped)))))));

exports.makeLookupExpression = lookup(scope, identifier, callbacks, false);

/////////////////////////
// makeInputExpression //
/////////////////////////

exports.makeInputExpression = (scope, parameter) => (
  Throw.assert(
    (
      scope !== ROOT_SCOPE &&
      scope.type !== DYNAMIC_SCOPE_TYPE),
    null,
    `Invalid scope for input expression`),
  (
    scope.type === AUXILIAR_SCOPE_TYPE ?
    exports.makeInputExpression(scope.parent, parameter) :
    Intrinsic.makeGetExpression(
      Tree.__ReadExpression__("input"),
      Tree.PrimitiveExpression(parameter),
      null)));

////////////////////////
// makeEvalExpression //
////////////////////////

exports.makeEvalExpression = (scope, expression) => {
  const copy = scope;
  const variables = [];
  let escaped = false;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === CLOSURE_SCOPE_TYPE) {
      escaped = true;
    } else if (scope.type === STATIC_SCOPE_TYPE) {
      for (let index = 0; index < scope.variables.length; index++) {
        const variable = scope.variables[index];
        if (!hasVariable(variables, variable.identifier)) {
          variables[variables.length] = variable;
          if (variable.type === NORMAL_VARIABLE_TYPE && variable.initialized === false && escaped) {
            binding.deadzone = true;
          }
        }
      }
    }
    scope = scope.parent;
  }
  State.registerEval(copy);
  const identifiers = [];
  for (let index = 0; index < variables.length; index++) {
    if (variable.type === NORMAL_VARIABLE_TYPE) {
      identifiers[identifiers.length] = Variable.Base(variable.name);
      if (variable.deadzone) {
        identifiers[identifiers.length] = Variable.Meta(variable.name);
      }
    }
  }
  return Tree.__EvalExpression__(identifiers, expression);
};

/////////////
// Getters //
/////////////

// exports.isAvailable = (scope, kind, identifier, callbacks) => {
//   const frames = [];
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === STATIC_SCOPE_TYPE) {
//       if (hasVariable(scope.variables, identifier)) {
//         return null;
//       }
// 
// 
//       for (let index = 0; index < scope.frame.length; index++) {
//         if (scope.frame[index].variable.name === identifier) {
//           if (!callbacks.static(scope.frame[index].variable)) {
//             return null;
//           }
//         }
//       }
//     } else if (scope.type === DYNAMIC_SCOPE_TYPE) {
//       frames[frames.length] = scope.frame;
//     }
//     if (ArrayLite.includes(scope.kinds, kind)) {
//       return frames;
//     }
//     scope = scope.parent;
//   }
//   return frames;
// };
