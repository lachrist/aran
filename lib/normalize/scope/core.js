"use strict";

// type Scope = (Parent, Frame)
// type Parent = Maybe Scope
// type Frame = (IsClosure, UseStrict, Dynamic, Bindings)
//
// type IsClosure = Bool
// type UseStrict = Bool
// type Dynamic = JSONable
// type Misses = Maybe (Set Identifier)
//
// type Bindings = Map Identifier (Initialized, Lookedup, Tag)
// type Identifier = String
// type Initialized = Bool
// type Lookedup = Bool
// type Tag = JSONable
//
// type IsFree = Boolean
// type Deadzone = Maybe Bool
// type Predicate = Identifier -> Kind -> Lookedup -> Tag -> Bool
//
// type Context = *
// type Result = *
// type Access = (Maybe AranExpression -> AranExpression)
// type OnMiss = Context -> Result
// type OnDynamic = Context -> Result -> Dynamic -> Result
// type OnHit = Context -> Kind -> Lookedup -> Tag -> Access -> Result

const Build = require("../build.js");

const global_Object_assign = global.Object.assign;
const global_Object_definePrototypeOf = global.Object.definePrototypeOf;
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

const set_prototype = {
  __proto__: null,
  add: global_Set_prototype_add,
  has: global_Set_prototype_has
};

//////////
// Pure //
//////////

exports.extend = (nullable_scope, is_closure, use_strict, dynamic) => ({
  __proto__: null,
  parent: nullable_scope,
  is_closure,
  use_strict,
  dynamic,
  misses: global_Object_setPrototypeOf(new global_Set(), set_prototype),
  bindings: {__proto__: null}
});

exports.get_identifiers = (scope) => global_Object_getOwnPropertyNames(scope);

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

exports.is_identifier_present = (scope, identifier) => identifier in scope.bindings;

exports.is_identifier_lookedup = (scope, identifier) => scope.bindings[identifier].lookedup;

exports.is_identifier_initialized = (scope, identifier) => scope.bindings[identifier].initialized;

exports.get_identifier_tag = (scope, identifier) => scope.bindings[identifier].tag;

/////////////
// Impures //
/////////////

exports.declare = (scope, identifier, json) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  if (identifier in scope.bindings) {
    throw new global_Error("Duplicate declaration");
  }
  if (scope.misses.has(identifier)) {
    throw new global_Error("Unexpected shadowing");
  }
  scope.bindings[identifier] = {
    __proto__: null,
    initialized: false,
    lookedup: false,
    tag: json
  };
};

exports.initialize = (scope, identifier, nullable_aran_expression) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  if (!(identifier in scope.bindings)) {
    throw new global_Error("Distant initialization");
  }
  if (scope.bindings[identifier].initialized) {
    throw new global_Error("Already initialized");
  }
  scope.bindings[identifier].initialized = true;
  if (nullable_aran_expression !== null) {
    return Build._write(identifier, nullable_aran_expression);
  }
};

exports.lookup = (nullable_scope, identifier, {on_hit, on_miss, on_dynamic}, context) => {
  const loop = (nullable_scope, is_free) => {
    if (nullable_scope === null) {
      return on_miss(context);
    }
    if (identifier in nullable_scope.bindings) {
      nullable_scope.bindings[identifier].lookedup = true;
      const {initialized, tag} = nullable_scope.bindings[identifier];
      return on_hit(context, DEDAZONES[initialized][is_free], tag, (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build._read(identifier);
        }
        return Build._write(identifier, nullable_aran_expression)
      });
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses.add(identifier);
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

exports.eval = (scope, predicate, expression) => {
  let is_free = false;
  const identifiers1 = global_Object_setPrototypeOf(new global_Set(), set_prototype);
  const identifiers2 = [];
  const frames = [];
  let nullable_scope = scope;
  while (nullable_scope !== null) {
    const frame = global_Object_assign({__proto__:null}, nullable_scope);
    delete frame.parent;
    frame.misses = null;
    frame.bindings = {__proto__:null};
    for (let identifier in nullable_scope.bindings) {
      if (!identifiers1.has(identifier)) {
        identifiers1.add(identifier);
        const {initialized, lookedup, tag} = nullable_scope.bindings[identifier];
        if (predicate(identifier, DEADZONES[initialized][is_free], lookedup, tag)) {
          identifiers2[identifiers2.length] = identifier;
          scope.bindings[identifier].lookedup = true;
          frame.bindings[identifier] = scope.bindings[identifier];
        }
      }
    }
    frames[frames.length] = frame;
    is_free = is_free || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  State.associate_scope_to_current_serial(global_JSON_stringify(frames));
  return Build._eval(identifiers2, expression);
};
