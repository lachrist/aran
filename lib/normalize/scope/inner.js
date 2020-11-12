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
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ROOT_SCOPE = null;

const DYNAMIC_FRAME_TYPE = "dynamic";
const STATIC_FRAME_TYPE = "static";
const BINDING_FRAME_TYPE = "binding";
const HORIZON_FRAME_TYPE = "horizon";
const EMPTY_FRAME_TYPE = "empty";
const CLOSURE_FRAME_TYPE = "closure";

const INITIALIZED_STATUS = true;
const NON_INITIALIZED_STATUS = false;
const MAYBE_INITIALIZED_STATUS = null;

const is_unique_kind = (kind) => (kind === "let" || kind === "const" || kind === "class");

////////////
// Extend //
////////////

exports._make_root = () /* -> Scope */ => ROOT_SCOPE;

exports._extend_closure = (parent) /* -> Scope */ => ({
  parent,
  type: CLOSURE_FRAME_TYPE,
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
  frame: json);

exports.EXTEND_EMPTY = (parent, callback) => Tree.__BLOCK__(
  [],
  callback(
    {
      parent,
      type: EMPTY_FRAME_TYPE,
      frame: null}));

// type Callback = Scope -> [AranStatement]
exports.EXTEND_STATIC = (parent, callback) /* -> Block */ => {
  const static_frame = {};
  const statement_array = callback({
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

// type Conflict = Either Kind DynamicFrame
exports._get_conflicts = (scope, kind, identifier) => /* [Conflict] */ {
  const conflicts = [];
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        conflicts[conflicts.length] = scope.frame[identifier].kind;
      }
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      conflicts[conflicts.length] = scope.frame;
    }
    if (ArrayLite.includes(scope.kinds, kind)) {
      return conflicts;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding frame for availability query");
};

//
//     if (scope.type === DYNAMIC_FRAME_TYPE) {
//       if (global_Reflect_getOwnPropertyDescriptor(scope.frame.static, identifier) !== void) {
//         if (unique || is_unique(scope.frame.static[identifier])) {
//           return false;
//         }
//       }
//     } else
//     if (kind in scope.kinds) {
//       return true;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing binding frame");
// };
//

// exports._is_available = (scope, kind, identifier) => {
//   const unique = is_unique(kind);
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === DYNAMIC_FRAME_TYPE) {
//       if (global_Reflect_getOwnPropertyDescriptor(scope.frame.static, identifier) !== void) {
//         if (unique || is_unique(scope.frame.static[identifier])) {
//           return false;
//         }
//       }
//     } else if (scope.type === STATIC_FRAME_TYPE) {
//       if (global_Reflect_getOwnPropertyDescriptor(scope.frame.static, identifier) !== void) {
//         if (unique || is_unique(scope.frame[identifier].kind)) {
//           return false;
//         }
//       }
//     }
//     if (kind in scope.kinds) {
//       return true;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing binding frame");
// };

// exports._is_available_static = (scope, kind, identifier) => {
//   while (scope !== ROOT_SCOPE) {
//     if (ArrayLite.includes(scope.kinds, kind)) {
//       if (scope.type !== STATIC_FRAME_TYPE) {
//         throw new global_Error("Hit a dynamic frame during static availability query");
//       }
//       // console.assert(scope.type === STATIC_FRAME_TYPE);
//       return global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0;
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing static frame for static availability query");
// };

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

exports._get_background = (scope => {
  while (scope.type !== ROOT_SCOPE) {
    if (scope.type === HORIZON_FRAME_TYPE) {
      return scope;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing horizon scope frame for background query");
};

exports._get_foreground = (scope) => {
  let array = [];
  while (scope.type !== ROOT_SCOPE) {
    if (scope.type === HORIZON_FRAME_TYPE) {
      return ArrayLite.flaten(array);
    }
    if (scope.type === STATIC_FRAME_TYPE) {
      array[array.length] = global_Reflect_ownKeys(scope.frame);
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing horizon scope frame for foreground query");
};

exports._declare = (scope, kind, identifier) => {
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
          status: NON_INITIALIZED_STATUS,
          has_dynamic_deadzone: false,
          kind: kind
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

exports.initialize = (scope, kind, identifier, expression) => {
  const distant = false;
  while (scope !== ROOT_SCOPE) {
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      return callback(scope.frame, scope, kind, identifier, expression);
    }
    if (scope.type === STATIC_FRAME_TYPE) {
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
    if (scope.type === EMPTY_FRAME_TYPE) {
      distant = true;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding scope frame for variable declaration");
}

// const get_eval_scope_is_closure_kind = (kinds) => (
//   kinds.length === 2 &&
//   (
//     kind[0] === "var" &&
//     kind[1] === "function") ||
//   (
//     kind[0] === "function" &&
//     kind[1] === "var"));

// exports._get_visibility = (scope) => {
//   const variables = [];
//   const done = {__proto__:null};
//   while (scope.type !== ROOT_SCOPE) {
//     if (scope.type === DYNAMIC_FRAME_TYPE) {
//       if (scope.frame.index !== null) {
//         return {
//           foreground: variables,
//           background: State._get_background(scope.frame.index),
//         };
//       }
//       if (scope.kinds.length > 0) {
//         throw new global_Error("Cannot statically collect scope");
//       }
//     } else if (scope.type === STATIC_FRAME_TYPE) {
//       const identifiers = global_Reflect_ownKeys(scope.frame);
//       for (let index = 0; index < identifiers.length; index++) {
//         const identifier = identifiers[index];
//         if (!(identifier in done)) {
//           done[identifier] = null;
//           variables[variables.length] = {
//             kind: scope.frame[identifier].kind,
//             duplicable: null,
//             name: identifier
//           };
//         }
//       }
//     }
//     scope = scope.parent;
//   }
//   throw new global_Error("Missing horizon-bounded dynamic frame");
// };

// exports._get_visibility = (scope, kinds) => {
//   const kinds = ArrayLite.concat(kinds);
//   const foreground = [];
//   while (scope !== ROOT_SCOPE) {
//     if (scope.type === DYNAMIC_FRAME_TYPE) {
//       if (scope.kinds.length > 0) {
//
//       }
//     }
//   }
// };

const get_frame = (scope, kind, identifier, callback1, callback2, callback3) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier)) {
        return {static:true, hit:true, scope:scope};
      }
    }
    if (scope.type === DYNAMIC_FRAME_TYPE) {
      if (scope.kinds.length > 0) {

      }
    }
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === STATIC_FRAME_TYPE) {
        return {static:true, hit:false, scope}
      } else {
        return {}
      }
    }
  }
  throw new global_Error("foo");
};

exports._check_declare = (scope, kind, identifier) => {
  scope = get_home(scope, kind, identifier);
  if (scope.type === DYNAMIC_FRAME_TYPE) {
    return scope.frame;
  }
  // console.assert(scope.type === STATIC_FRAME_TYPE);
  return global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0;
};

exports._declare = (scope, kind, identifier, callback) => {
  scope = get_home(scope, kinds, identifier);
  if (scope.type === DYNAMIC_FRAME_TYPE) {
    return scope.frame;
  }
  // console.assert(scope.type === STATIC_FRAME_TYPE);
  if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0) {
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
    return true;
  }
  return false;
};

exports.initialize = (scope, kind, identifier, expression, callback) => {
  scope = get_home(scope, kind, identifier);
  if (scope.type === DYNAMIC_FRAME_TYPE) {
    return callback(scope.frame, kind, identifier, expression);
  }
  if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) === void 0) {
    throw new global_Error("Missing initialization");
  }
  const binding = scope.frame[identifier];

}

const declare = (scope, kind, identifier, callback, perform) => {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return false;
      }
      if (ArrayLite.includes(scope.kinds, kind)) {
        if (perform) {
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
        }
        return true;
      }
    } else if (scope.type === DYNAMIC_FRAME_TYPE) {
      if (!callback(scope.frame, kind, identifier)) {
        return false;
      }
      if (ArrayLite.includes(scope.kinds, kind)) {
        return scope.frame;
      }
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing binding scope frame for variable declaration");
};

/////////////
// Impures //
/////////////

exports._declare = (scope, kind, identifier, callback) => /* Either Boolean DynamicFrame */ {
  while (scope !== ROOT_SCOPE) {
    if (scope.type === STATIC_FRAME_TYPE) {
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return false;
      }
      if (ArrayLite.includes(scope.kinds, kind)) {
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
        return true;
      }
    } else if (scope.type === DYNAMIC_FRAME_TYPE && scope.kinds.length > 0) {
      if (ArrayLite.includes(scope.kinds, kind)) {
        return scope.frame;
      }
      throw new global_Error("Cannot check for variable duplication");
    }
    scope = scope.parent
  }
  throw new global_Error("Missing binding scope frame for variable declaration");
}

exports._declare = (scope, kind, identifier) => /* Either Boolean DynamicFrame */ {
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return scope.frame.dynamic;
      }
      // console.assert(scope.type === STATIC_FRAME_TYPE);
      // N.B.: Variable duplication should be checked upstream, so this check should never fail
      if (global_Reflect_getOwnPropertyDescriptor(scope.frame, identifier) !== void 0) {
        return scope.frame[identifier].kind;
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
      return true;
    }
    scope = scope.parent;
  }
  throw new global_Error("Missing matching scope frame for variable declaration");
};

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

exports.initialize = (scope, kind, identifier, expression, callback) /* -> Undefined */ => {
  let distant = false;
  while (scope !== ROOT_SCOPE) {
    if (ArrayLite.includes(scope.kinds, kind)) {
      if (scope.type === DYNAMIC_FRAME_TYPE) {
        return callback(scope.frame.dynamic);
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
      return callbacks.on_with_frame(context, scope.frame.dynamic, loop(scope.parent, escaped));
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
