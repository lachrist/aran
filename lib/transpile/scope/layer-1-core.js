"use strict";

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
const Stratum = require("../../stratum.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");

const ROOT_SCOPE = null;

const DYNAMIC_FRAME_TYPE = "dynamic";
const STATIC_FRAME_TYPE = "static";
const BINDING_FRAME_TYPE = "binding";
const CLOSURE_FRAME_TYPE = "closure";

////////////
// Extend //
////////////

exports._make_root = () /* -> Scope */ => ROOT_SCOPE;

exports._extend_closure = (parent) /* -> Scope */ => ({
  parent,
  type: CLOSURE_FRAME_TYPE,
  kinds: [],
  frame: null
});

exports._extend_binding = (parent, key, value) /* Scope */ => ({
  parent,
  type: BINDING_FRAME_TYPE,
  kinds: [],
  frame: {key, value}
});

exports._extend_dynamic = (parent, kinds, json)  /* -> Scope */ => ({
  parent,
  type: DYNAMIC_FRAME_TYPE,
  kinds,
  frame: json});

// type Callback = Scope -> [AranStatement]
exports.EXTEND_STATIC = (parent, kinds, callback) /* -> Block */ => {
  const static_frame = [];
  const statement = callback({
    parent,
    type: STATIC_FRAME_TYPE,
    kinds,
    frame: static_frame
  });
  const statement_array = [];
  const stratified_identifier_array = [];
  for (let index = 0; index < static_frame.length; index++) {
    const binding = static_frame[index];
    // console.assert(!(binding.ghost && binding.initialized))
    // console.assert(!(binding.ghost && binding.has_dynamic_deadzone))
    if (!binding.variable.ghost) {
      const identifier = binding.variable.name;
      Throw.assert(binding.initialized !== false, null, `Non initialized non-ghost variable ${identifier}`);
      stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
      if (binding.has_dynamic_deadzone) {
        stratified_identifier_array[stratified_identifier_array.length] = Stratum._meta(identifier);
        statement_array[statement_array.length] = Tree.Lift(Tree.__write__(Stratum._meta(identifier), Tree.primitive(false)));
      }
    }
  }
  statement_array[statement_array.length] = statement;
  return Tree.__BLOCK__(stratified_identifier_array, statement_array);
};

/////////////
// Getters //
/////////////

exports._get_binding = (scope, key) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === BINDING_FRAME_TYPE && scope.frame.key === key) {
      return scope.frame.value;
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Binding not found`);
};

exports._get_depth = (scope) /* -> Counter */ => {
  let counter = 0;
  while (scope !== ROOT_SCOPE) {
    counter++;
    scope = scope.parent;
  }
  return counter;
};

exports._is_available = (scope, kind, identifier, callbacks) => {
  const frames = [];
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      for (let index = 0; index < scope.frame.length; index++) {
        if (scope.frame[index].variable.name === identifier) {
          if (!callbacks.static(scope.frame[index].variable)) {
            return null;
          }
        }
      }
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      frames[frames.length] = scope.frame;
    }
    if (ArrayLite.includes(scope.kinds, kind)) {
      return frames;
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Missing binding frame for availability query`);
};

/////////////
// Declare //
/////////////

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

exports._declare = (scope, variable) => /* Either Boolean DynamicFrame */ {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, variable.kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return {
          static: false,
          frame: scope.frame
        };
      }
      for (let index = 0; index < scope.frame.length; index++) {
        if (scope.frame[index].variable.name === variable.name) {
          return {
            static: true,
            conflict: scope.frame[index].variable
          };
        }
      }
      scope.frame[scope.frame.length] = {
        variable: variable,
        initialized: false,
        has_dynamic_deadzone: false
      };
      return {
        static: true,
        conflict: null
      };
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Missing binding scope frame for variable declaration`);
};

////////////////
// Initialize //
////////////////

exports._initialize = (scope, kind, identifier, maybe) => {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return {
          static: false,
          frame: scope.frame
        }
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      for (let index = 0; index < scope.frame.length; index++) {
        if (scope.frame[index].variable.name === identifier) {
          const binding = scope.frame[index];
          Throw.assert(!binding.variable.ghost, null, `Ghost variable initialization`);
          Throw.assert(binding.variable.kind === kind, null, `Kind mismatch during variable initialization`);
          Throw.assert(binding.initialized === false, null, `Duplicate variable initialization`);
          binding.initialized = maybe ? null : true;
          if (maybe) {
            binding.has_dynamic_deadzone = true;
          }
          return {
            static: true,
            variable: binding.variable,
            read: () => Tree.__read__(Stratum._base(identifier)),
            initialize: (expression) => {
              expression = Tree.__write__(Stratum._base(identifier), expression);
              if (binding.has_dynamic_deadzone) {
                expression = Tree.sequence(expression, Tree.__write__(Stratum._meta(identifier), Tree.primitive(true)));
              }
              return expression
            }
          };
        }
      }
      Throw.abort(null, `Missing variable for initialization`)
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Missing binding scope frame for variable initialization`);
};

////////////
// Lookup //
////////////

// type Context = *
// type Escaped = Boolean
// type Callbacks = (OnMiss, OnDeadHit, OnLiveHit, OnDynamicFrame)
// type OnMiss :: Context -> AranExpression
// type OnDeadHit :: (Context, Tag) -> Expression
// type OnLiveHit :: (Context, Tag, Access) -> Expression
// type OnWithFrame :: (Context, JSON, JSON, Expression) -> Expression
// type OnEvalFrame :: (Context, JSON, Expression) -> Expression
// type Access :: Maybe Expression -> Expression
exports.lookup = (scope, identifier, callbacks) /* -> Expression */ => {
  let is_closure_free = true;
  const loop = (scope, escaped) => {
    if (scope === ROOT_SCOPE) {
      return callbacks.on_miss();
    }
    if (scope.type === BINDING_FRAME_TYPE) {
      return loop(scope.parent, escaped);
    }
    if (scope.type === CLOSURE_FRAME_TYPE) {
      is_closure_free = false;
      return loop(scope.parent, true);
    }
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callbacks.on_dynamic_frame(scope.frame, loop(scope.parent, escaped));
    }
    // console.assert(scope.type === STATIC_FRAME_TYPE);
    for (let index = 0; index < scope.frame.length; index++) {
      if (scope.frame[index].variable.name === identifier) {
        const binding = scope.frame[index];
        if (binding.variable.ghost || (is_closure_free && binding.initialized === false)) {
          return callbacks.on_static_dead_hit(binding.variable);
        }
        const read = () => Tree.__read__(Stratum._base(identifier));
        const write = (expression) => Tree.__write__(Stratum._base(identifier), expression);
        if (binding.initialized === true) {
          return callbacks.on_static_live_hit(binding.variable, read, write);
        }
        // console.assert(scope.frame[identifier].initialized === null || !is_closure_free);
        binding.has_dynamic_deadzone = true;
        return Tree.conditional(
          Tree.__read__(Stratum._meta(identifier)),
          callbacks.on_static_live_hit(binding.variable, read, write),
          callbacks.on_static_dead_hit(binding.variable));
      }
    }
    return loop(scope.parent);
  };
  return loop(scope);
};

exports.input = (scope, parameter) => Intrinsic.get(
  Tree.__read__("input"),
  Tree.primitive(parameter),
  null);

///////////////////
// Serialization //
///////////////////

exports.eval = (scope, expression) => {
  const identifiers1 = [];
  let is_closure_free = true;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === CLOSURE_FRAME_TYPE) {
      is_closure_free = false;
    } else if (scope.type === STATIC_FRAME_TYPE) {
      next: for (let index = 0; index < scope.frame.length; index++) {
        const binding = scope.frame[index];
        for (let index = 0; index < identifiers1.length; index++) {
          if (identifiers1[index] === binding.variable.name) {
            continue next;
          }
        }
        identifiers1[identifiers1.length] = binding.variable.name;
        if (binding.initialized === false && !is_closure_free && !binding.variable.ghost) {
          binding.has_dynamic_deadzone = true;
        }
      }
    }
    scope = scope.parent;
  }
  return Tree.__eval__(expression);
};
