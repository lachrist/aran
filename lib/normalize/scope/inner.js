"use strict";

// Invariant hypothesis: `scope` is a black box outside this module.

// type EstreeIdentifier = estree.Identifier
// type AranIdentifier = aran.lang.Identifier
// type Statement = aran.lang.Statement
// type Expression = aran.lang.Expression
// type Parameter = aran.lang.Parameter
//
// type Scope = Maybe (Parent, Frame)
// type Parent = Scope
// type Frame = Either MarkerFrame (Either StaticFrame DynamicFrame)
//
// type MarkerFrame = Either UseStrictMarkerFrame ClosureMarkerFrame
// type UseStrictMarkerFrame = ()
// type ClosureMarkerFrame = ()
//
// type DynamicFrame = JSON
// type StaticFrame = Either MutableStaticFrame ImmutableStaticFrame
// type MutableStaticFrame = Map Identifier Binding
// type ImmutableStaticFrame = Map Identifier Binding
// type Binding = Maybe (Initialized, HasDynamicDeadzone, Tag)
// type Initialized = Boolean
// type HasDynamicDeadzone = Boolean
// type Tag = JSON

const ArrayLite = require("array-lite");
const Lang = require("../lang.js");
const State = require("../state.js");
const Stratum = require("./stratum.js");

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const USE_STRICT_FRAME_TYPE = 1;
const CLOSURE_FRAME_TYPE = 2;
const DYNAMIC_FRAME_TYPE = 3;
const MUTABLE_STATIC_FRAME_TYPE = 4;
const IMMUTABLE_STATIC_FRAME_TYPE = 5;

////////////
// Extend //
////////////

exports._extend_closure = (parent) => ({
  parent,
  type: CLOSURE_FRAME_TYPE,
  frame: null
});

exports._extend_use_strict = (parent) => ({
  parent,
  type: USE_STRICT_FRAME_TYPE,
  frame: null
});

exports._extend_dynamic = (parent, dynamic_frame) => ({
  parent,
  type: DYNAMIC_FRAME_TYPE,
  frame: dynamic_frame
});

// type Callback = Scope -> [AranStatement]
exports.EXTEND_STATIC = (parent, callback) => {
  const static_frame = {__proto__:null};
  const statement = callback({
    parent,
    type: MUTABLE_STATIC_FRAME_TYPE,
    frame: static_frame
  });
  const statement_array = [];
  const stratified_identifier_array = [];
  // Deterministic property traveral: https://www.ecma-international.org/ecma-262/#sec-ordinaryownpropertykeys
  for (let identifier in static_frame) {
    if (static_frame[identifier] !== null) {
      if (!static_frame[identifier].initialized) {
        throw new global_Error("Uninitialized identifier");
      }
      stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
      if (static_frame[identifier].has_dynamic_deadzone) {
        stratified_identifier_array[stratified_identifier_array.length] = Stratum._meta(identifier);
        statement_array[statement_array.length] = Lang.Lift(Lang.__write__(Stratum._meta(identifier), Lang.primitive(false)));
      }
    }
  }
  statement_array[statement_array.length] = statement;
  return Lang.__BLOCK__(stratified_identifier_array, statement_array);
};

/////////////
// Getters //
/////////////

exports._is_strict = (scope) => {
  while (scope !== null) {
    if (scope.type === USE_STRICT_FRAME_TYPE) {
      return true;
    }
    scope = scope.parent;
  }
  return false;
};

// type Predicate = DynamicFrame -> Boolean
exports._get_dynamic_frame = (scope, predicate) => {
  while (scope !== null) {
    if (scope.type === DYNAMIC_FRAME_TYPE && predicate(scope.frame)) {
      return scope.frame;
    }
    scope = scope.parent;
  }
  return null;
};

exports._get_depth = (scope) => {
  let counter = 0;
  while (scope !== null) {
    if (scope.type === MUTABLE_STATIC_FRAME_TYPE || scope.type === IMMUTABLE_STATIC_FRAME_TYPE) {
      counter++;
    }
    scope = scope.parent;
  }
  return counter;
};

exports._is_declared = (scope, identifier) => {
  if (scope === null || (scope.type !== MUTABLE_STATIC_FRAME_TYPE && scope.type !== IMMUTABLE_STATIC_FRAME_TYPE)) {
    throw new global_Error("Invalid scope for declaration query");
  }
  return identifier in scope.frame;
};

exports._get_tag = (scope, identifier) => {
  while (scope !== null) {
    if (scope.type === MUTABLE_STATIC_FRAME_TYPE || scope.type === IMMUTABLE_STATIC_FRAME_TYPE) {
      if (identifier in scope.frame) {
        return scope.frame[identifier].tag;
      }
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing tag");
};

/////////////
// Impures //
/////////////

exports._declare = (scope, identifier, tag) => {
  if (scope === null || scope.type !== MUTABLE_STATIC_FRAME_TYPE) {
    throw new global_Error("Invalid scope for declaration");
  }
  if (identifier in scope.frame) {
    if (scope.frame[identifier] === null) {
      throw new global_Error("Late shadowing");
    }
    throw new global_Error("Duplicate declaration");
  }
  scope.frame[identifier] = {
    initialized: false,
    has_dynamic_deadzone: false,
    tag
  };
};

exports.initialize = (scope, identifier, expression) => {
  if (scope === null || scope.type !== MUTABLE_STATIC_FRAME_TYPE) {
    throw new global_Error("Invalid scope for initialization");
  }
  if (!(identifier in scope.frame)) {
    throw new global_Error("Undeclared initialization");
  }
  if (scope.frame[identifier] === null) {
    throw new global_Error("Undeclared (but shadowed) initialization");
  }
  if (scope.frame[identifier].initialized) {
    throw new global_Error("Duplicate initialization");
  }
  scope.frame[identifier].initialized = true;
  expression = Lang.__write__(Stratum._base(identifier), expression);
  if (scope.frame[identifier].has_dynamic_deadzone) {
    return Lang.sequence(expression, Lang.__write__(Stratum._meta(identifier), Lang.primitive(true)));
  }
  return expression;
};

// exports._declare = (scope, identifier, tag) => {
//   while (scope !== null) {
//     if (scope.type === IMMUTABLE_STATIC_FRAME) {
//       throw new global_Error("Identifier declaration on immutable static frame");
//     }
//     if (scope.type === MUTABLE_STATIC_FRAME) {
//       if (identifier in scope.frame) {
//         throw new global_Error("Duplicate identifier declaration or late identifier shadowing");
//       }
//       scope.frame[identifier] = {
//         initialized: false,
//         has_dynamic_deadzone: false,
//         tag
//       };
//       return;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("No static frame found (declare)");
// };

// exports.initialize = (scope, identifier, tag) => {
//   while (scope !== null) {
//     if (scope.type === IMMUTABLE_STATIC_FRAME_TYPE) {
//       throw new global_Error("Identifier initialization on immutable static frame");
//     }
//     if (scope.type === MUTABLE_STATIC_FRAME_TYPE) {
//       if (identifier in scope.bindings) {
//         if (scope.bindings[identifier] === null) {
//           throw new global_Error("Initialization of (shadowed) undeclared identifier");
//         }
//         if (scope.bindings[identifier].initialized) {
//           throw new global_Error("Duplicate identifier initialization");
//         }
//         scope.bindings[identifier].initialized = true;
//         expression = Lang.__write__(Stratum._base(identifier), expression);
//         if (scope.bindings[identifier].has_dynamic_deadzone) {
//           return Lang.sequence(expression, Lang.__write__(Stratum._meta(identifier), Lang.primitive(true)));
//         }
//         return expression;
//       }
//       throw new global_Error("Initialization of undeclared identifier");
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("No static frame found (initialize)");
// };

// type Context = *
// type Escaped = Boolean
// type Callbacks = (OnMiss, OnDeadHit, OnLiveHit, OnDynamicFrame)
// type OnMiss :: Context -> AranExpression
// type OnDeadHit :: (Context, Tag) -> AranExpression
// type OnLiveHit :: (Context, Tag, Access) -> AranExpression
// type OnDynamicFrame :: (Context, Dynamic, AranExpression) -> AranExpression
// type Access :: Maybe AranExpression -> AranExpression
exports.lookup = (scope, identifier, context, callbacks) => {
  // console.assert(scope.misses !== null);
  const loop = (scope, escaped) => {
    if (scope === null) {
      return callbacks.on_miss(context);
    }
    if (scope.type === USE_STRICT_FRAME_TYPE) {
      return loop(scope.parent, escaped);
    }
    if (scope.type === CLOSURE_FRAME_TYPE) {
      return loop(scope.parent, true);
    }
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callbacks.on_dynamic_frame(context, scope.frame, loop(scope.parent, escaped));
    }
    // console.assert(scope.type === MUTABLE_STATIC_FRAME_TYPE || scope.type === IMMUTABLE_STATIC_FRAME_TYPE);
    if (identifier in scope.frame) {
      if (scope.frame[identifier] === null) {
        return loop(scope.parent, escaped);
      }
      const access = (nullable_expression) => {
        if (nullable_expression === null) {
          return Lang.__read__(Stratum._base(identifier));
        }
        return Lang.__write__(Stratum._base(identifier), nullable_expression);
      };
      if (scope.frame[identifier].initialized) {
        return callbacks.on_live_hit(context, scope.frame[identifier].tag, access);
      }
      if (!escaped) {
        return callbacks.on_dead_hit(context, scope.frame[identifier].tag);
      }
      if (scope.frame[identifier].has_dynamic_deadzone !== true) {
        // console.assert(scope.type === MUTABLE_STATIC_FRAME_TYPE);
        scope.frame[identifier].has_dynamic_deadzone = true;
      }
      return Lang.conditional(
        Lang.__read__(Stratum._meta(identifier)),
        callbacks.on_live_hit(context, scope.frame[identifier].tag, access),
        callbacks.on_dead_hit(context, scope.frame[identifier].tag));
    }
    if (scope.type === MUTABLE_STATIC_FRAME_TYPE) {
      scope.frame[identifier] = null;
    }
    return loop(scope.parent, escaped);
  };
  return loop(scope, false);
};

const PARAMETERS = {
  "this": "THIS",
  "new.target": "NEW_TARGET",
  "arguments": "ARGUMENTS",
  "error": "ERROR"
};

exports.parameter = (scope, parameter) => Lang.__read__(PARAMETERS[parameter]);

///////////////////
// Serialization //
///////////////////

exports.eval = (scope, expression) => {
  const frame_array = [];
  const stratified_identifier_array = [];
  let escaped = false;
  while (scope !== null) {
    if (scope.type === USE_STRICT_FRAME_TYPE) {
      frame_array[frame_array.length] = "use-strict";
    } else if (scope.type === CLOSURE_FRAME_TYPE) {
      escaped = true;
      frame_array[frame_array.length] = "closure";
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      frame_array[frame_array.length] = scope.frame;
      frame_array[frame_array.length] = "dynamic";
    } else {
      // console.assert(scope.type === MUTABLE_STATIC_FRAME_TYPE || scope.type === IMMUTABLE_STATIC_FRAME_TYPE);
      const static_frame = {__proto__:null};
      for (let identifier in scope.frame) {
        const binding = scope.frame[identifier];
        if (binding !== null && !ArrayLite.includes(stratified_identifier_array, Stratum._base(identifier))) {
          if (escaped && !binding.initialized && binding.has_dynamic_deadzone !== true) {
            // console.assert(scope.type === MUTABLE_STATIC_FRAME_TYPE);
            binding.has_dynamic_deadzone = true;
          }
          stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
          if (binding.has_dynamic_deadzone) {
            stratified_identifier_array[stratified_identifier_array.length] = Stratum._meta(identifier);
          }
          static_frame[identifier] = {
            initialized: binding.initialized,
            has_dynamic_deadzone: binding.has_dynamic_deadzone,
            tag: binding.tag
          };
        }
      }
      frame_array[frame_array.length] = static_frame;
      frame_array[frame_array.length] = "static";
    }
    scope = scope.parent;
  }
  State.register_eval(ArrayLite.reverse(frame_array));
  return Lang.__eval__(stratified_identifier_array, expression);
};

exports._deserialize = (frame_array, is_use_strict, callback) => {
  let scope = null;
  for (let index = 0 ; index < frame_array.length; index++) {
    if (frame_array[index] === "use-strict") {
      scope = {
        parent: scope,
        type: USE_STRICT_FRAME_TYPE,
        frame: null
      };
    } else if (frame_array[index] === "closure") {
      scope = {
        parent: scope,
        type: CLOSURE_FRAME_TYPE,
        frame: null
      };
    } else if (frame_array[index] === "dynamic") {
      index++;
      scope = {
        parent: scope,
        type: DYNAMIC_FRAME_TYPE,
        frame: frame_array[index]
      };
    } else {
      // console.assert(frame_array[index] === "static")
      index++;
      scope = {
        parent:scope,
        type: IMMUTABLE_STATIC_FRAME_TYPE,
        frame: global_Reflect_getPrototypeOf(frame_array[index]) === null ? frame_array[index] : global_Object_assign({
          __proto__: null,
        }, frame_array[index])
      };
    }
  }
  return scope;
};
