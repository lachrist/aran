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
const Tree = require("../tree.js");
const Stratum = require("../../stratum.js");

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
  const static_frame = {};
  const statement = callback({
    parent,
    type: STATIC_FRAME_TYPE,
    kinds,
    frame: static_frame
  });
  const statement_array = [];
  const stratified_identifier_array = [];
  const identifiers = global_Reflect_ownKeys(static_frame);
  // Deterministic property traveral: https://www.ecma-international.org/ecma-262/#sec-ordinaryownpropertykeys
  for (let index = 0; index < identifiers.length; index++) {
    const identifier = identifiers[index];
    const binding = static_frame[identifier];
    // console.assert(!(binding.ghost && binding.initialized))
    // console.assert(!(binding.ghost && binding.has_dynamic_deadzone))
    if (!binding.ghost) {
      Throw.assert(binding.ghost || binding.initialized, null, `Non initialized non-ghost variable`);
      stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
      if (static_frame[identifier].has_dynamic_deadzone) {
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
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        if (!callbacks.static(scope.frame[identifier].kind)) {
          return null;
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

exports._declare = (scope, kind, ghost, data, identifier) => /* Either Boolean DynamicFrame */ {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return {
          static: false,
          value: scope.frame
        };
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return {
          static: true,
          value: scope.frame[identifier].kind
        };
      }
      global_Reflect_defineProperty(scope.frame, identifier, {
        __proto__: null,
        value: {
          kind,
          ghost,
          data,
          initialized: false,
          has_dynamic_deadzone: false
        },
        writable: true,
        enumerable: true,
        configurable: true
      });
      return {
        static: true,
        value: null
      };
    }
    scope = scope.parent;
  }
  Throw.abort(null, `Missing binding scope frame for variable declaration`);
};

////////////////
// Initialize //
////////////////

exports._initialize = (scope, kind, identifier, expression, maybe) => {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return {
          static: false,
          value: scope.frame
        }
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      Throw.assert(global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0, null, `Missing variable for initialization`)
      const binding = scope.frame[identifier];
      Throw.assert(!binding.ghost, null, `Ghost variable initialization`);
      Throw.assert(binding.kind === kind, null, `Kind mismatch during variable initialization`);
      Throw.assert(!binding.initialized) null, `Duplicate variable initialization`);
      binding.initialized = maybe ? null : true;
      if (maybe) {
        binding.has_dynamic_deadzone = true;
      }
      expression = Tree.__write__(Stratum._base(identifier), expression);
      if (binding.has_dynamic_deadzone) {
        expression = Tree.sequence(expression, Tree.__write__(Stratum._meta(identifier), Tree.primitive(true)));
      }
      return {
        static: true,
        value: expression
      };
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
    if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
      const binding = scope.frame[identifier];
      if (binding.ghost || (is_closure_free && binding.initialized === false)) {
        return callbacks.on_dead_hit(binding.kind, binding.data);
      }
      const access = (nullable_expression) => {
        if (nullable_expression === null) {
          return Tree.__read__(Stratum._base(identifier));
        }
        return Tree.__write__(Stratum._base(identifier), nullable_expression);
      };
      if (binding.initialized === true) {
        return callbacks.on_live_hit(binding.kind, binding.data, access);
      }
      // console.assert(scope.frame[identifier].initialized === null || !is_closure_free);
      binding.has_dynamic_deadzone = true;
      return Tree.conditional(
        Tree.__read__(Stratum._meta(identifier)),
        callbacks.on_live_hit(binding.kind, binding.data, access),
        callbacks.on_dead_hit(binding.kind, binding.data));
    }
    return loop(scope.parent);
  };
  return loop(scope);
};

exports.parameter = (scope, parameter) => Tree.__read__(parameter);

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
      const identifiers2 = global_Reflect_ownKeys(scope.frame);
      next: for (let index = 0; index < identifiers2.length; index++) {
        const identifier = identifiers2[index];
        // const base_identifier = Stratum._base(identifier);
        const binding = scope.frame[identifier];
        for (let index = 0; index < identifiers1.length; index++) {
          if (identifiers1[index] === identifier) {
            continue next;
          }
        }
        identifiers1[identifiers1.length] = identifier;
        if (binding.initialized === false && !is_closure_free) {
          binding.has_dynamic_deadzone = true;
        }
      }
    }
    scope = scope.parent;
  }
  return Tree.__eval__(expression);
};
