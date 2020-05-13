"use strict";

// Invariant hypothesis: the `core` module is not accessed outside this module.

const Core = require("./core.js");

const global_Error = global.Error;

//////////
// Meta //
//////////

const meta = (identifier) => {
  return "_" + identifier;
};

const meta_callbacks = {
  on_live_hit: (nullable_aran_expression, tag, access) => {
    // console.assert(tag === null);
    return access(nullable_aran_expression);
  },
  on_dead_hit: /* istanbul ignore next */ () => {
    // console.assert(false);
  },
  on_miss: (nullable_aran_expression) => {
    throw new global_Error("Missing meta identifier");
  },
  on_dynamic_frame: (nullable_aran_expression, dynamic, aran_expression) => {
    return aran_expression;
  }
};

exports.declare_initialize_meta = (scope, identifier, aran_expression) => {
  let counter = 1;
  const depth = Core._get_depth(scope);
  identifier += "_" + depth + "_";
  while (Core._is_declared(scope, meta(identifier + counter))) {
    counter++;
  }
  identifier += counter;
  Core._declare(scope, meta(identifier), null);
  return {
    identifier,
    aran_expression: Core.initialize(scope, meta(identifier), aran_expression)
  };
};

exports.access_meta = (scope, identifier, nullable_aran_expression) => {
  return Core.lookup(scope, meta(identifier), meta_callbacks, nullable_aran_expression);
};

//////////
// Base //
//////////

const base = (extended_identifier) => {
  if (extended_identifier === "new.target") {
    return "$0newtarget";
  }
  return "$" + extended_identifier;
};

exports._declare_base = (scope, extended_identifier, tag) => {
  Core._declare(scope, base(extended_identifier), tag);
};

exports.initialize_base = (scope, extended_identifier, aran_expression) => {
  return Core.initialize(scope, base(extended_identifier), aran_expression);
};

exports.lookup_base = (scope, extended_identifier, callbacks, context) => {
  return Core.lookup(scope, base(extended_identifier), callbacks, context);
};

/////////////
// Forward //
/////////////

exports.parameter = Core.parameter;

exports._is_strict = Core._is_strict;

exports.GLOBAL = Core.GLOBAL;

exports.REGULAR = Core.REGULAR

exports.CLOSURE = Core.CLOSURE;

exports.DYNAMIC = Core.DYNAMIC;

exports.EVAL = Core.EVAL;
