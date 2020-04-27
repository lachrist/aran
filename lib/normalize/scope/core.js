"use strict";

// type Scope = (Parent, Frame)
// type Parent = Maybe Scope
// type Frame = (IsClosure, UseStrict, Dynamic, Bindings)
//
// type IsClosure = Bool
// type UseStrict = Bool
// type Dynamic = JSON
// type Misses = Maybe (Set Key)
//
// type Bindings = Map Key (Initialized, Lookedup, Tag)
// type Key = String
// type Initialized = Bool
// type Lookedup = Bool
// type Tag = JSON
//
// type IsFree = Boolean
// type Deadzone = Maybe Bool
// type FilterKey = Key -> Kind -> Lookedup -> Tag -> Bool
//
// type Context = *
// type Result = *
// type Access = (Maybe AranExpression -> AranExpression)
// type OnMiss = Context -> Result
// type OnDynamic = Context -> Result -> Dynamic -> Result
// type OnHit = Context -> Kind -> Lookedup -> Tag -> Access -> Result

const Build = require("../build.js");

const global_Object_assign = global.Object.assign;
const global_Object_getOwnPropertyNames = global.Object.getOwnPropertyNames;
const global_Error = global.Error;
const global_Set = global.Set;
const global_Set_prototype_add = global.Set.prototype.add; 
const global_Set_prototype_has = global.Set.prototype.has;
const global_JSON_parse = global.JSON.parse;
const global_JSON_stringify = global.JSON.stringify;

const DEADZONES = {
  __proto__: null,
  true: {
    __proto__: null,
    true: false,
    false: false
  },
  false: {
    __proto__: null,
    true: null,
    false: true
  }
};

const make_standalone_set = () => {
  const set = new global_Set();
  set.add = global_Set_prototype_add;
  set.has = global_Set_prototype_has;
  return set;
};

////////////
// Create //
////////////

exports.extend = (nullable_scope, is_closure, use_strict, dynamic) => ({
  __proto__: null,
  parent: nullable_scope,
  is_closure: is_closure,
  use_strict: use_strict,
  dynamic: dynamic,
  misses: make_standalone_set(),
  bindings: {__proto__: null}
});

/////////////
// Getters //
/////////////

exports.get_keys = (scope, filter_key) => {
  const keys = [];
  for (let key in scope.bindings) {
    const {initialized, lookedup, box} = scope.bindings[key];
    if (filter_key(key, DEADZONES[initialized][false], lookedup, box)) {
      keys[keys.length] = key;
    }
  }
  return keys;
};

exports.get_depth = (nullable_scope) => {
  let depth = 0;
  while (nullable_scope !== null) {
    depth++:
    nullable_scope = nullable_scope.parent;
  }
  return depth;
};

exports.is_strict = (nullable_scope) => {
  while (nullable_scope !== null) {
    if (nullable_scope.use_strict) {
      return true;
    }
    nullable_scope = nullable_scope.parent;
  }
  return false;
};

exports.is_key_present = (scope, key) => key in scope.bindings;

exports.is_key_lookedup = (scope, key) => {
  if (key in scope.bindings) {
    return scope.bindings[scope].lookedup
  }
  throw new global_Error("Distant query");
};

exports.is_key_initialized = (scope, key) => {
  if (key in scope.bindings) {
    return scope.bindings[scope].initialized
  }
  throw new global_Error("Distant query");
}

exports.get_key_tag = (scope, key) => {
  if (key in scope.bindings) {
    return scope.bindings[scope].tag
  }
  throw new global_Error("Distant query");
};

// exports.is_key_direct = (nullable_scope, key) => {
//   while (nullable_scope !== null) {
//     if (key in nullable_scope) {
//       return true;
//     }
//     if (nullable_scope.dynamic !== null) {
//       return false;
//     }
//     nullable_scope = nullable_scope.parent;
//   }
//   return false;
// };

/////////////
// Setters //
/////////////

exports.declare = (scope, key, json) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  if (key in scope.bindings) {
    throw new global_Error("Duplicate declaration");
  }
  if (scope.misses.has(key)) {
    throw new global_Error("Unexpected shadowing");
  }
  scope.bindings[key] = {
    __proto__: null,
    initialized: false,
    lookedup: false,
    tag: json
  };
};

exports.initialize = (scope, key, nullable_aran_expression) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  if (!(key in scope.bindings)) {
    throw new global_Error("Distant initialization");
  }
  if (scope.bindings[key].initialized) {
    throw new global_Error("Already initialized");
  }
  scope.bindings[key].initialized = true;
  if (nullable_aran_expression !== null) {
    return Build._write(key, nullable_aran_expression);
  }
};

exports.lookup = (nullable_scope, key, {on_hit, on_miss, on_dynamic}, context) => {
  const loop = (nullable_scope, is_free) => {
    if (nullable_scope === null) {
      return on_miss(context);
    }
    if (key in nullable_scope.bindings) {
      const {initialized, lookedup, box} = nullable_scope.bindings[key];
      nullable_scope.bindings[key].lookedup = true;
      return on_hit(context, DEDAZONES[initialized][is_free], lookedup, box, (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build._read(key);
        }
        return Build._write(key, nullable_aran_expression)
      });
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses.add(key);
    }
    is_free = is_free || nullable_scope.is_closure;
    if (nullable_scope.dynamic === null) {
      return loop(nullable_scope.parent, is_free);
    }
    return on_dynamic(context, loop(nullable_scope.parent, is_free), nullable_scope.dynamic);
  };
  return loop(scope, false);
};

////////////////
// Convertion //
////////////////

exports.parse = (string) => {
  const frames = global_JSON_parse(string);
  let nullable_scope = null;
  for (let index = frames.length - 1; index >= 0; index--) {
    nullable_scope = global_Object_assign({
      __proto__: null,
      parent: nullable_scope
    }, frames[index]);
  }
  return nullable_scope;
};

exports.stringify = (scope, filter_key) => {
  let is_free = false;
  const keys = make_set();
  const frames = [];
  let nullable_scope = scope;
  while (nullable_scope !== null) {
    const frame = global_Object_assign({__proto__:null}, nullable_scope);
    delete frame.parent;
    frame.misses = null;
    frame.bindings = {__proto__:null};
    for (let key in nullable_scope.bindings) {
      if (!keys.has(key)) {
        keys.add(key);
        const {initialized, lookedup, box} = nullable_scope.bindings[key];
        if (callback(key, DEADZONES[initialized][is_free], lookedup, box)) {
          scope.bindings[key].lookedup = true;
          frame.bindings[key] = scope.bindings[key];
        }
      }
    }
    frames[frames.length] = frame;
    is_free = is_free || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  return global_JSON_stringify(frames);
};
