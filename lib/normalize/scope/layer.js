"use strict";

const Core = require("./core.js");

// Invariant hypothesis: the `core` module is not accessed outside this module.

//////////
// Meta //
//////////

const meta = (identifier) => {
  return "_" + identifier;
};

const meta_callbacks = {
  on_hit: (nullable_aran_expression, tag, access) => {
    // console.assert(tag === null);
    return access(nullable_aran_expression);
  },
  on_deadzone: () => {
    // console.assert(false);
  },
  on_miss: (nullable_aran_expression) => {
    throw new global_Error("Missing meta identifier");
  },
  on_dynamic: (nullable_aran_expression, aran_expression, dynamic) => {
    return aran_expression;
  }
};

exports.declare_meta = (scope, identifier, aran_expression) => {
  let counter = 0;
  const depth = Core.get_depth(scope);
  identifier += "_" + depth + "_";
  while (Core.is_declared(scope, meta(identifier + counter)) {
    counter++;
  }
  return Core.declare(scope, meta(identifier + counter), null);
  return identifier + counter;
};

exports.initialize_meta = (scope, meta_identifier, aran_expression) => {
  return Core.initialize(scope, identifier), aran_expression);
};

exports.lookup_meta = (scope, identifier, nullable_aran_expression) => Core.lookup(scope, meta(identifier), meta_callbacks, nullable_aran_expression);

//////////
// Base //
//////////

const base = (extended_identifier) => {
  if (extended_identifier === "new.target") {
    return "$0newtarget";
  }
  return "$" + extended_identifier;
};

exports.base = base;

exports.declare_base = (scope, extended_identifier, tag) => {
  Core.declare(scope, base(extended_identifier), tag);
  return extended_identifier;
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

exports.read_parameter = Core.read_parameter;

exports.is_strict = Core.is_strict;

exports.eval = Core.eval;

exports.extend_block = Core.extend_block;

exports.extend_global = Core.extend_global;

exports.extend_closure = Core.extend_closure;

exports.extend_eval = Core.extend_eval;
