"use strict";

// Invariant hypothesis: `scope` is a black box outside this module.
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

const Tree = require("../tree.js");
const State = require("../state.js");
const Stratum = require("../../stratum.js");

const global_JSON_parse = global.JSON.parse;
const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ROOT_SCOPE = null;
const SHADOW_BINDING = null;

const USE_STRICT_FRAME_TYPE = 1;
const CLOSURE_FRAME_TYPE = 2;
const DYNAMIC_FRAME_TYPE = 3;
const STATIC_FRAME_TYPE = 4;

const INITIALIZED_STATUS = true;
const NON_INITIALIZED_STATUS = false;
const DISTANTLY_INITIALIZED_STATUS = null;

////////////
// Extend //
////////////

exports._make_root = () /* -> Scope */ => ROOT_SCOPE;

exports._extend_closure = (parent) /* -> Scope */ => ({
  parent,
  type: CLOSURE_FRAME_TYPE,
  frame: null
});

exports._extend_use_strict = (parent)  /* -> Scope */ => ({
  parent,
  type: USE_STRICT_FRAME_TYPE,
  frame: null
});

exports._extend_dynamic = (parent, dynamic_frame)  /* -> Scope */ => ({
  parent,
  type: DYNAMIC_FRAME_TYPE,
  frame: dynamic_frame
});

// type Callback = Scope -> [AranStatement]
exports.EXTEND_STATIC = (parent, callback) /* -> Block */ => {
  const static_frame = {};
  const statement = callback({
    parent,
    type: STATIC_FRAME_TYPE,
    frame: static_frame
  });
  const statement_array = [];
  const stratified_identifier_array = [];
  const identifiers = global_Reflect_ownKeys(static_frame);
  // Deterministic property traveral: https://www.ecma-international.org/ecma-262/#sec-ordinaryownpropertykeys
  for (let index = 0; index < identifiers.length; index++) {
    const identifier = identifiers[index];
    if (static_frame[identifier] !== SHADOW_BINDING) {
      // for-in and for-of requires ``fake'' variables for shadow purpose do not require to be initialized
      // for (let x in 123) { let x = 456 }
      // if (static_frame[identifier].status === NON_INITIALIZED_STATUS) {
      //   throw new global_Error("Uninitialized identifier");
      // }
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

exports._is_root = (scope) => scope === ROOT_SCOPE;

exports._is_strict = (scope) /* -> Boolean */ => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === USE_STRICT_FRAME_TYPE) {
      return true;
    }
    scope = scope.parent;
  }
  return false;
};

// type Predicate = DynamicFrame -> Boolean
exports._get_dynamic_frame = (scope, predicate) /* -> DynamicFrame */ => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_FRAME_TYPE && predicate(scope.frame)) {
      return scope.frame;
    }
    scope = scope.parent;
  }
  return null;
};

exports._get_depth = (scope) /* -> Counter */ => {
  let counter = 0;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      counter++;
    }
    scope = scope.parent;
  }
  return counter;
};

exports._is_declared = (scope, identifier) /* -> Boolean */ => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      return identifier in scope.frame;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing static scope frame for declaration query");
};

exports._get_tag = (scope, identifier) /* -> Tag */  => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
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

exports._declare = (scope, identifier, tag) /* -> Undefined */ => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier)) {
        if (scope.frame[identifier] === SHADOW_BINDING) {
          throw new global_Error("Late shadowing");
        }
        throw new global_Error("Duplicate declaration");
      }
      scope.frame[identifier] = {
        status: NON_INITIALIZED_STATUS,
        has_dynamic_deadzone: false,
        tag
      };
      return void 0;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing static scope frame for declaration");
};

// Distant initialization is required for normalizing switch blocks:
//
// switch (x) {
//   case y: let foo;
//   case z: foo;
// }
//
// let foo;
// let _discriminant = x;
// let _matched = false;
// if (_matched ? true : _discriminant === y) {
//   _matched = true;
//   foo = void 0; // distant initialization
// }
// if (_matched ? true : _discriminant === y) {
//   _matched = true;
//   foo; // dynamic deadzone
// }
exports.initialize = (scope, identifier, expression) /* -> Undefined */ => {
  let status = INITIALIZED_STATUS;
  while (scope !== ROOT_SCOPE) {
    if (scope.type == STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier)) {
        if (scope.frame[identifier] === SHADOW_BINDING) {
          throw new global_Error("Shadowed initialization");
        }
        if (scope.frame[identifier].status !== NON_INITIALIZED_STATUS) {
          throw new global_Error("Duplicate initialization");
        }
        scope.frame[identifier].status = status;
        if (status === DISTANTLY_INITIALIZED_STATUS) {
          scope.frame[identifier].has_dynamic_deadzone = true;
        }
        return (
          scope.frame[identifier].has_dynamic_deadzone ?
          Tree.sequence(
            Tree.__write__(Stratum._base(identifier), expression),
            Tree.__write__(Stratum._meta(identifier), Tree.primitive(true))) :
          Tree.__write__(Stratum._base(identifier), expression));
      }
      status = DISTANTLY_INITIALIZED_STATUS;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing matching static scope frame for initialization");
};

// type Context = *
// type Escaped = Boolean
// type Callbacks = (OnMiss, OnDeadHit, OnLiveHit, OnDynamicFrame)
// type OnMiss :: Context -> AranExpression
// type OnDeadHit :: (Context, Tag) -> Expression
// type OnLiveHit :: (Context, Tag, Access) -> Expression
// type OnDynamicFrame :: (Context, Dynamic, Expression) -> Expression
// type Access :: Maybe Expression -> Expression
exports.lookup = (scope, identifier, context, callbacks) /* -> Expression */ => {
  let is_closure_free = true;
  const loop = (scope, escaped) => {
    if (scope === ROOT_SCOPE) {
      return callbacks.on_miss(context);
    }
    if (scope.type === USE_STRICT_FRAME_TYPE) {
      return loop(scope.parent);
    }
    if (scope.type === CLOSURE_FRAME_TYPE) {
      is_closure_free = false;
      return loop(scope.parent, true);
    }
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callbacks.on_dynamic_frame(context, scope.frame, loop(scope.parent));
    }
    // console.assert(scope.type === STATIC_FRAME_TYPE);
    if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier)) {
      if (scope.frame[identifier] === SHADOW_BINDING) {
        return loop(scope.parent);
      }
      const access = (nullable_expression) => {
        if (nullable_expression === null) {
          return Tree.__read__(Stratum._base(identifier));
        }
        return Tree.__write__(Stratum._base(identifier), nullable_expression);
      };
      if (scope.frame[identifier].status === INITIALIZED_STATUS) {
        return callbacks.on_live_hit(context, scope.frame[identifier].tag, access);
      }
      if (is_closure_free && scope.frame[identifier].status === NON_INITIALIZED_STATUS) {
        return callbacks.on_dead_hit(context, scope.frame[identifier].tag);
      }
      scope.frame[identifier].has_dynamic_deadzone = true;
      return Tree.conditional(
        Tree.__read__(Stratum._meta(identifier)),
        callbacks.on_live_hit(context, scope.frame[identifier].tag, access),
        callbacks.on_dead_hit(context, scope.frame[identifier].tag));
    }
    scope.frame[identifier] = SHADOW_BINDING;
    return loop(scope.parent);
  };
  return loop(scope);
};

const PARAMETERS = {
  "this": "THIS",
  "new.target": "NEW_TARGET",
  "arguments": "ARGUMENTS",
  "error": "ERROR"
};

exports.parameter = (scope, parameter) => Tree.__read__(PARAMETERS[parameter]);

///////////////////
// Serialization //
///////////////////

exports.eval = (scope, expression, _scope) => {
  _scope = scope;
  const stratified_identifier_array = [];
  let is_closure_free = true;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === CLOSURE_FRAME_TYPE) {
      is_closure_free = false;
    } else if (scope.type === STATIC_FRAME_TYPE) {
      const identifiers = global_Reflect_ownKeys(scope.frame);
      next: for (let index = 0; index < identifiers.length; index++) {
        const identifier = identifiers[index];
        const base_identifier = Stratum._base(identifier);
        const binding = scope.frame[identifier];
        if (binding !== SHADOW_BINDING) {
          for (let index = 0; index < stratified_identifier_array.length; index++) {
            if (stratified_identifier_array[index] === base_identifier) {
              continue next;
            }
          }
          if (binding.status === NON_INITIALIZED_STATUS && !is_closure_free) {
            binding.has_dynamic_deadzone = true;
          }
          stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
          if (binding.has_dynamic_deadzone) {
            stratified_identifier_array[stratified_identifier_array.length] = Stratum._meta(identifier);
          }
        }
      }
    }
    scope = scope.parent;
  }
  // Deep clone to prevent side future effects -- eg: initialization
  State._register_scope(global_JSON_parse(global_JSON_stringify(_scope)));
  return Tree.__eval__(stratified_identifier_array, expression);
};
