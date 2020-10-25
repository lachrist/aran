"use strict";

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
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ROOT_SCOPE = null;

const CLOSURE_FRAME_TYPE = "closure";
const DYNAMIC_FRAME_TYPE = "dynamic";
const STATIC_FRAME_TYPE = "static";
const BINDING_FRAME_TYPE = "binding";

const INITIALIZED_STATUS = true;
const NON_INITIALIZED_STATUS = false;
const MAYBE_INITIALIZED_STATUS = null;

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
  frame: [key, value]
});

exports._extend_dynamic = (parent, kinds, dynamic_frame)  /* -> Scope */ => ({
  parent,
  type: DYNAMIC_FRAME_TYPE,
  kinds,
  frame: dynamic_frame
});

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
    // for-in and for-of requires ``fake'' variables for shadow purpose do not require to be initialized
    // for (let x in 123) { let x = 456 }
    // if (static_frame[identifier].initialized === NON_INITIALIZED_STATUS) {
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

exports._is_available_static = (scope1, kind, identifier) => {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        throw new global_Error("Hit a dynamic frame during static availability query");
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      return global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing static frame for static availability query");
};

// exports._is_lexically_available = (scope, identifier) => {
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === STATIC_FRAME_TYPE) {
//       if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
//         return false;
//       }
//     }
//     if (scope.type === EVAL_FRAME_TYPE) {
//       return true;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing eval/static frame for lexical frame query");
// };
//
// exports._is_locally_available = (scope, identifier) => {
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === STATIC_FRAME_TYPE) {
//       return global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing static frame for local variable query");
// };

// exports._get_eval_frame = (scope) => {
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === EVAL_FRAME_TYPE) {
//       return scope.frame;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing eval frame for eval frame query");
// };

// exports._is_strict = (scope) /* -> Boolean */ => {
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === USE_STRICT_FRAME_TYPE) {
//       return true;
//     }
//     scope = scope.parent;
//   }
//   return false;
// };

exports._get_binding = (scope, key) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === BINDING_FRAME_TYPE && scope.frame[0] === key) {
      return scope.frame[1];
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

exports._get_static_kind = (scope, identifier) /* -> Tag */  => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return scope.frame[identifier].kind;
      }
    }
    scope = scope.parent;
  }
  return null;
};

/////////////
// Impures //
/////////////

// type Callback1 :: (Scope, Kind, Identifier) -> a
// type Callback2 :: () -> a
exports._declare = (scope, kind, identifier) => /* a */ {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return scope.frame;
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      // N.B.: Variable duplication should be checked upstream, so this check should never fail in production
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        throw new global_Error("Duplicate variable declaration");
      }
      global_Reflect_defineProperty(scope.frame, identifier, {
        __proto__: null,
        value: {
          status: NON_INITIALIZED_STATUS,
          has_dynamic_deadzone: false,
          kind: kind
        },
        writable: true,
        enumerable: true,
        configurable: true
      });
      return null;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing matching scope frame for variable declaration");
};

exports.initialize = (scope, kind, identifier, expression, callback) /* -> Undefined */ => {
  let distant = false;
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return callback(scope.frame);
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0) {
        throw new global_Error("Missing variable declaration for variable initialization");
      }
      if (scope.frame[identifier].initialized !== NON_INITIALIZED_STATUS) {
        throw new global_Error("Duplicate variable initialization");
      }
      if (distant) {
        scope.frame[identifier].initialized = MAYBE_INITIALIZED;
        scope.frame[identifier].has_dynamic_deadzone = true;
      } else {
        scope.frame[identifier].initialized = INITIALIZED;
      }
      expression = Tree.__write__(Stratum._base(identifier), expression);
      if (scope.frame[identifier].has_dynamic_deadzone) {
        return Tree.sequence(expression, Tree.__write__(Stratum._meta(identifier), Tree.primitive(true)));
      }
      return expression;
    }
    distant = distant || scope.type === STATIC_FRAME_TYPE;
    scope = scope.parent;
  }
  throw new global_Error("Missing matching scope frame for variable initialization");
};

// Callback :: (Scope, Hoisting) -> Statement
exports.Declare = (scope, hoisting, callback) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      for (let identitifier in hoisting) {
        if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
          throw new global_Error("Duplicate declaration");
        }
        global_Reflect_defineProperty(scope.frame, identifier, {
          __proto__: null,
          value: {
            status: NON_INITIALIZED_STATUS,
            has_dynamic_deadzone: false,
            hoisting[identifier]
          },
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      return Tree.Bundle([]);
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callback(scope, hoisting);
    }
  }
};

// exports._declare_static = (scope, identifier, tag) /* -> Undefined */ => {
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === STATIC_FRAME_TYPE) {
//       if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
//         return false;
//       }
//       global_Reflect_defineProperty(scope.frame, identifier, {
//         __proto__: null,
//         value: {
//           status: NON_INITIALIZED_STATUS,
//           has_dynamic_deadzone: false,
//           tag
//         },
//         writable: true,
//         enumerable: true,
//         configurable: true
//       });
//       return true;
//     } else if (scope.type === DYNAMIC_FRAME_TYPE) {
//       throw new global_Error("Hit a dynamic scope frame during declaration");
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing static scope frame for static declaration");
// };

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
// type Callback :: (Scope, Identifier, Expression, DynamicFrame) -> Maybe Expression
exports.initialize = (scope, identifier, expression, callback) /* -> Undefined */ => {
  let distant = false;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        if (scope.frame[identifier].initialized !== NON_INITIALIZED_STATUS) {
          throw new global_Error("Duplicate initialization");
        }
        if (distant) {
          scope.frame[identifier].initialized = MAYBE_INITIALIZED;
          scope.frame[identifier].has_dynamic_deadzone = true;
        } else {
          scope.frame[identifier].initialized = INITIALIZED;
        }
        const expression = Tree.__write__(Stratum._base(identifier), expression);
        if (scope.frame[identifier].has_dynamic_deadzone) {
          return Tree.sequence(expression, Tree.__write__(Stratum._meta(identifier), Tree.primitive(true)));
        }
        return expression;
      }
      distant = true;
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      const nullable_expression = callback(scope, identifier, expression, scope.frame);
      if (nullable_expression !== null) {
        return nullable_expression;
      }
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing matching scope frame for initialization");
};

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
      return callbacks.on_with_frame(context, scope.frame, loop(scope.parent, escaped));
    }
    // console.assert(scope.type === STATIC_FRAME_TYPE);
    if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
      const access = (nullable_expression) => {
        if (nullable_expression === null) {
          return Tree.__read__(Stratum._base(identifier));
        }
        return Tree.__write__(Stratum._base(identifier), nullable_expression);
      };
      if (scope.frame[identifier].initialized === INITIALIZED_STATUS) {
        return callbacks.on_live_hit(context, scope.frame[identifier].tag, access);
      }
      if (is_closure_free && scope.frame[identifier].initialized === NON_INITIALIZED_STATUS) {
        return callbacks.on_dead_hit(context, scope.frame[identifier].tag);
      }
      // console.assert(scope.frame[identifier].initialized === MAYBE_INITIALIZED_STATUS || !is_closure_free);
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
        if (binding.initialized === NON_INITIALIZED_STATUS && !is_closure_free) {
          binding.has_dynamic_deadzone = true;
        }
      }
    }
    scope = scope.parent;
  }
  // Deep clone to prevent side future effects -- eg: initialization
  State._register_scope(global_JSON_parse(global_JSON_stringify(_scope)));
  return Tree.__eval__(expression);
};
