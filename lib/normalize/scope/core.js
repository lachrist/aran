"use strict";

// type Scope = (Parent, Frame)
// type Parent = Maybe Scope
// type Frame = (IsClosure, UseStrict, Dynamic, Bindings)
//
// type IsClosure = Bool
// type UseStrict = Bool
// type Dynamic = JSONable
// type Misses = Maybe (Set aran_identifier)
//
// type Bindings = Map aran_identifier (Initialized, Lookedup, Tag)
// type aran_identifier = String
// type Initialized = Bool
// type Lookedup = Bool
// type Tag = JSONable
//
// type IsFree = Boolean
// type Deadzone = Maybe Bool
// type Predicate = aran_identifier -> Kind -> Lookedup -> Tag -> Bool
//
// type Context = *
// type Result = *
// type Access = (Maybe Aranaran_expression -> Aranaran_expression)
// type OnMiss = Context -> Result
// type OnDynamic = Context -> Result -> Dynamic -> Result
// type OnHit = Context -> Kind -> Lookedup -> Tag -> Access -> Result

const Build = require("../build.js");
const State = require("../state.js");

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

exports.get_declared = (scope) => global_Object_getOwnPropertyNames(scope);

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

exports.is_declared = (scope, aran_identifier) => aran_identifier in scope.bindings;

exports.is_lookedup = (scope, aran_identifier) => scope.bindings[aran_identifier].lookedup;

exports.is_initialized = (scope, aran_identifier) => scope.bindings[aran_identifier].initialized;

exports.get_tag = (scope, aran_identifier) => scope.bindings[aran_identifier].tag;

/////////////
// Impures //
/////////////

exports.declare = (scope, aran_identifier, json) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  // if (identifier === "root" || identifier === "arguments" || identifier === "eval" || identifier === "evalcheck") {
  //   throw new global_Error("The following identifiers are forbidden in Aran: arguments, eval, evalcheck, and root");
  // }
  if (aran_identifier in scope.bindings) {
    throw new global_Error("Duplicate declaration");
  }
  if (scope.misses.has(aran_identifier)) {
    throw new global_Error("Unexpected shadowing");
  }
  scope.bindings[aran_identifier] = {
    __proto__: null,
    initialized: false,
    lookedup: false,
    tag: json
  };
};

exports.initialize = (scope, aran_identifier, nullable_aran_expression) => {
  if (scope.misses === null) {
    throw new global_Error("Immutable scope");
  }
  if (!(aran_identifier in scope.bindings)) {
    throw new global_Error("Distant initialization");
  }
  if (scope.bindings[aran_identifier].initialized) {
    throw new global_Error("Already initialized");
  }
  scope.bindings[aran_identifier].initialized = true;
  if (nullable_aran_expression !== null) {
    return Build._write(aran_identifier, nullable_aran_expression);
  }
};

exports.lookup = (nullable_scope, aran_identifier, {on_hit, on_miss, on_dynamic}, context) => {
  const loop = (nullable_scope, is_free) => {
    if (nullable_scope === null) {
      return on_miss(context);
    }
    if (aran_identifier in nullable_scope.bindings) {
      nullable_scope.bindings[aran_identifier].lookedup = true;
      const {initialized, tag} = nullable_scope.bindings[aran_identifier];
      return on_hit(context, DEADZONES[initialized][is_free], tag, (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build._read(aran_identifier);
        }
        return Build._write(aran_identifier, nullable_aran_expression)
      });
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses.add(aran_identifier);
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

exports.build_block = (scope, aran_statements, filter) => Build._BLOCK(ArrayLite.filter(global_Object_getOwnPropertyNames(scope.bindings), (aran_identifier) => {
  const {initialized, lookedup, tag} = scope.bindings[aran_identifier];
  return filter(aran_identifier, initialized, lookedup, tag);
}), aran_statements);

exports.from_frames = (frames) => {
  let nullable_scope = null;
  for (let index = frames.length - 1; index >= 0; index--) {
    nullable_scope = global_Object_assign({
      __proto__: null,
      parent: nullable_scope
    }, frames[index]);
  }
  return nullable_scope;
};

exports.build_eval = (nullable_scope, aran_expression, predicate) => {
  let is_free = false;
  const aran_identifiers1 = global_Object_setPrototypeOf(new global_Set(), set_prototype);
  const aran_identifiers2 = [];
  const frames = [];
  while (nullable_scope !== null) {
    const frame = global_Object_assign({__proto__:null}, nullable_scope);
    delete frame.parent;
    delete frame.misses;
    frame.bindings = {__proto__:null};
    const frame = {
      __proto__: null,
      is_closure: nullable_scope.is_closure,
      use_strict: nullable_scope.use_strict,
      dynamic: nullable_scope.dynamic,
      misses: null,
      bindings: {__proto__: null}
    };
    for (let aran_identifier in nullable_scope.bindings) {
      if (!aran_identifiers1.has(aran_identifier)) {
        aran_identifiers1.add(aran_identifier);
        const {initialized, lookedup, tag} = nullable_scope.bindings[aran_identifier];
        if (predicate(aran_identifier, DEADZONES[initialized][is_free], lookedup, tag)) {
          aran_identifiers2[aran_identifiers2.length] = aran_identifier;
          scope.bindings[aran_identifier].lookedup = true;
          frame.bindings[aran_identifier] = global_Object_assign({__proto__:null}, scope.bindings[aran_identifier]);
        }
      }
    }
    frames[frames.length] = frame;
    is_free = is_free || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  // return {
  //   eval: (aran_expression) => Build._eval(aran_identifiers2, aran_expression),
  //   frames: global_JSON_stringify(frames)
  // };
  State.associate_scope_to_current_serial(frames);
  return Build._eval(aran_identifiers2, aran_expression);
};
