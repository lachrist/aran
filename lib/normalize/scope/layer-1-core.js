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

const Tree = require("../tree.js");
const State = require("../state.js");
const Stratum = require("../../stratum.js");

const global_JSON_parse = global.JSON.parse;
const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Error = global.Error;

const ROOT_SCOPE = null;

const DYNAMIC_FRAME_TYPE = "dynamic";
const STATIC_FRAME_TYPE = "static";
const BINDING_FRAME_TYPE = "binding";
const HORIZON_FRAME_TYPE = "horizon";
const EMPTY_FRAME_TYPE = "empty";
const CLOSURE_FRAME_TYPE = "closure";

////////////
// Extend //
////////////

exports._make_root = () /* -> Scope */ => ROOT_SCOPE;

exports._extend_closure = (parent) /* -> Scope */ => ({
  parent,
  type: CLOSURE_FRAME_TYPE,
  frame: null
});

exports._extend_horizon = (parent) /* Scope */ => ({
  parent,
  type: HORIZON_FRAME_TYPE,
  frame: null
});

exports._extend_binding = (parent, key, value) /* Scope */ => ({
  parent,
  type: BINDING_FRAME_TYPE,
  frame: {key, value}
});

exports._extend_dynamic = (parent, json)  /* -> Scope */ => ({
  parent,
  type: DYNAMIC_FRAME_TYPE,
  frame: json});

exports.EXTEND_EMPTY = (parent, callback) => Tree.__BLOCK__(
  [],
  [
    callback(
      {
        parent,
        type: EMPTY_FRAME_TYPE,
        frame: null})]);

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
    // for-in and for-of requires ``fake'' variables for shadow purpose which do not require to be initialized
    // for (let x in 123) { let x = 456 }
    // if (static_frame[identifier].initialized === false) {
    //   throw new global_Error("Uninitialized identifier");
    // }
    stratified_identifier_array[stratified_identifier_array.length] = Stratum._base(identifier);
    if (static_frame[identifier].has_dynamic_deadzone) {
      stratified_identifier_array[stratified_identifier_array.length] = Stratum._meta(identifier);
      statement_array[statement_array.length] = Tree.Lift(Tree.__write__(Stratum._meta(identifier), Tree.primitive(false)));
    }
  }
  statement_array[statement_array.length] = statement;
  return Tree.__BLOCK__(stratified_identifier_array, statement_array);
};

/////////////
// Getters //
/////////////

exports._get_tag = (scope, identifier) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE && global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
      return scope.frame[identifier].tag;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding static scope frame for tag query");
};

exports._get_binding = (scope, key) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === BINDING_FRAME_TYPE && scope.frame.key === key) {
      return scope.frame.value;
    }
    scope = scope.parent;
  }
  throw new global_Error("Binding not found");
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

exports._get_background = (scope) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === HORIZON_FRAME_TYPE) {
      return scope;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing horizon scope frame for background query");
};

exports._get_foreground = (scope) => {
  let identifiers1 = [];
  while (scope !== ROOT_SCOPE) {
    if (scope.type === HORIZON_FRAME_TYPE) {
      return identifiers1;
    }
    if (scope.type === STATIC_FRAME_TYPE) {
      const identifiers2 = global_Reflect_ownKeys(scope.frame);
      for (let index = 0; index < identifiers2.length; index++) {
        identifiers1[identifiers1.length] = identifiers2[index];
      }
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing horizon scope frame for foreground query");
};

/////////////
// Impures //
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

exports._declare = (scope, identifier, tag) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return scope.frame;
    }
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return false;
      }
      global_Reflect_defineProperty(scope.frame, identifier, {
        __proto__: null,
        value: {
          initialized: false,
          has_dynamic_deadzone: false,
          tag: tag
        },
        writable: true,
        enumerable: true,
        configurable: true
      });
      return true;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding scope frame for variable declaration");
}

exports._initialize = (scope, identifier, expression, callback) => {
  let distant = false;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return {
        done: false,
        value: scope.frame
      };
    }
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0) {
        throw new global_Error("Missing variable declaration for variable initialization");
      }
      if (scope.frame[identifier].initialized !== false) {
        throw new global_Error("Duplicate variable initialization");
      }
      if (distant) {
        scope.frame[identifier].initialized = null;
        scope.frame[identifier].has_dynamic_deadzone = true;
      } else {
        scope.frame[identifier].initialized = true;
      }
      expression = Tree.__write__(Stratum._base(identifier), expression);
      if (scope.frame[identifier].has_dynamic_deadzone) {
        return {
          done: true,
          value: Tree.sequence(expression, Tree.__write__(Stratum._meta(identifier), Tree.primitive(true)))
        };
      }
      return {
        done: true,
        value: expression
      };
    }
    if (scope.type === EMPTY_FRAME_TYPE) {
      distant = true;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding scope frame for variable initialization");
}

// type Context = *
// type Escaped = Boolean
// type Callbacks = (OnMiss, OnDeadHit, OnLiveHit, OnDynamicFrame)
// type OnMiss :: Context -> AranExpression
// type OnDeadHit :: (Context, Tag) -> Expression
// type OnLiveHit :: (Context, Tag, Access) -> Expression
// type OnWithFrame :: (Context, JSON, JSON, Expression) -> Expression
// type OnEvalFrame :: (Context, JSON, Expression) -> Expression
// type Access :: Maybe Expression -> Expression
exports.lookup = (scope, identifier, context, callbacks) /* -> Expression */ => {
  let is_closure_free = true;
  const loop = (scope, escaped) => {
    if (scope === ROOT_SCOPE) {
      return callbacks.on_miss(context);
    }
    if (scope.type === BINDING_FRAME_TYPE) {
      return loop(scope.parent, escaped);
    }
    if (scope.type === CLOSURE_FRAME_TYPE) {
      is_closure_free = false;
      return loop(scope.parent, true);
    }
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callbacks.on_dynamic_frame(context, scope.frame, loop(scope.parent, escaped));
    }
    // console.assert(scope.type === STATIC_FRAME_TYPE);
    if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
      const access = (nullable_expression) => {
        if (nullable_expression === null) {
          return Tree.__read__(Stratum._base(identifier));
        }
        return Tree.__write__(Stratum._base(identifier), nullable_expression);
      };
      if (scope.frame[identifier].initialized === true) {
        return callbacks.on_live_hit(context, scope.frame[identifier].tag, access);
      }
      if (is_closure_free && scope.frame[identifier].initialized === false) {
        return callbacks.on_dead_hit(context, scope.frame[identifier].tag);
      }
      // console.assert(scope.frame[identifier].initialized === null || !is_closure_free);
      scope.frame[identifier].has_dynamic_deadzone = true;
      return Tree.conditional(
        Tree.__read__(Stratum._meta(identifier)),
        callbacks.on_live_hit(context, scope.frame[identifier].tag, access),
        callbacks.on_dead_hit(context, scope.frame[identifier].tag));
    }
    return loop(scope.parent);
  };
  return loop(scope);
};

exports.parameter = (scope, parameter) => Tree.__read__(parameter);

///////////////////
// Serialization //
///////////////////

exports.eval = (scope, expression, _scope) => {
  _scope = scope;
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
  // Deep clone to prevent future side effects -- e.g.: initialization
  State._register_scope(global_JSON_stringify(_scope));
  return Tree.__eval__(expression);
};
