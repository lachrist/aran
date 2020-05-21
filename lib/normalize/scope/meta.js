
"use strict";

// Invariant hypothesis: `Core._declare`, `Core.initialize`, and `Core.lookup` are only access in `Meta` and `Base`. 
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type MetaIdentifier = <Strings which are valid JS identifier that starts with a `_`>
// type Box = Either MetaIdentifier Primitive

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring

const ArrayLite = require("array-lite");
const Core = require("./core.js");
const Build = require("../build.js");

const global_Error = global.Error;

const callbacks = {
  on_live_hit: (nullable_aran_expression, tag, access) => {
    // console.assert(tag === null);
    return access(nullable_aran_expression);
  },
  on_dead_hit: /* istanbul ignore next */ (nullable_aran_expression, tag) => {
    // console.assert(false);
  },
  on_miss: /* istanbul ignore next */ (nullable_aran_expression) => {
    // console.assert(false);
  },
  on_dynamic_frame: (nullable_aran_expression, dynamic, aran_expression) => aran_expression
};

const make = (scope, identifier, either_primitive_aran_expression, callback1, callback2) => {
  if (typeof either_primitive_aran_expression !== "object" || either_primitive_aran_expression === null) {
    if (typeof either_primitive_aran_expression === "symbol") {
      throw new global_Error("Cannot box a symbol");
    }
    if (typeof either_primitive_aran_expression === "string") {
      return callback1("$" + either_primitive_aran_expression);
    }
    return callback1(either_primitive_aran_expression);
  }
  let counter = 1;
  const depth = Core._get_depth(scope);
  let meta_identifier = "_" + identifier + "_" + depth + "_";
  while (Core._is_declared(scope, meta_identifier + counter)) {
    counter++;
  }
  meta_identifier += counter;
  Core._declare(scope, meta_identifier, null);
  return callback2(Core.initialize(scope, meta_identifier, either_primitive_aran_expression), meta_identifier);
};

exports.get = (scope, container) => {
  if (typeof container === "string") {
    if (container[0] === "$") {
      return Build.primitive(global_Reflect_apply(global_String_prototype_substring, container, [1]));
    }
    // console.assert(container[0] === "_");
    return Core.lookup(scope, container, null, callbacks);
  }
  return Build.primitive(container);
};

exports.set = (scope, container, aran_expression) => {
  if (typeof container !== "string" || container[0] !== "_") {
    throw new global_Error("Cannot set an inlined box");
  }
  return Core.lookup(scope, container, aran_expression, callbacks);
};

exports.box = (scope, identifier, either_primitive_aran_expression, callback) => {
  return make(scope, identifier, either_primitive_aran_expression, callback, (aran_expression, container) => {
    return Build.sequence(aran_expression, callback(container));
  });
};

exports.Box = (scope, identifier, either_primitive_aran_expression, callback) => {
  return make(scope, identifier, either_primitive_aran_expression, callback, (aran_expression, container) => {
    return ArrayLite.concat(Build.Lift(aran_expression), callback(container));
  });
};
