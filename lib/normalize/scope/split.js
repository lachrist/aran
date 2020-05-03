"use strict";

const Core = require("./core.js");

const global_String_prototype_substring = global.String.prototype.substring;
const global_Reflect_apply = global.Reflect.apply;

const direct_callbacks = {
  __proto__: null,
  on_hit: (nullable_aran_expression, deadzone, tag, access) => {
    // console.assert((deadzone === false) && (tag === null));
    return access(nullable_aran_expression);
  },
  on_miss: (nullable_aran_expression) => {
    throw new global_Error("Missing direct identifier");
  },
  on_dynamic: (nullable_aran_expression, aran_expression, dynamic) => aran_expression
};

const ARRAY_ONE = [1];

///////////
// Param //
///////////

const PARAMETERS = {
  __proto__: null,
  "new.target": "NewTarget",
  "this": "This",
  "arguments": "Arguments",
  "error": "Error"
};

const para = (extended_identifier) => {
  if (extended_identifier in PARAMETERS) {
    return PARAMETERS[extended_identifier];
  }
  throw new global_Error("Invalid parameter name");
};

const un_para = (aran_identifier) => {
  for (let extended_identifier in PARAMETERS) {
    if (PARAMETERS[extended_identifier] === aran_identifier) {
      return extended_identifier;
    }
  }
  throw new global_Error("Not a parameter aran identifier");
};

exports.declare_initialize_para = (scope, extended_identifier) => {
  const param_aran_identifier = param(extended_identifier);
  Core.declare(scope, param_aran_identifier, null);
  Core.initialize(scope, param_aran_identifier, null);
};

exports.lookup_para = (scope, extended_identifier, nullable_aran_expression) => Core.lookup(scope, param(extended_identifier), direct_callbacks, nullable_aran_expression);

//////////
// Meta //
//////////

const meta = (identifier) => "_" + identifier;

const is_meta = (aran_identifier) => aran_identifier[0] === "_";

const un_meta = (meta_aran_identifier) => Reflect_apply(String_prototype_substring, meta_aran_identifier, ARRAY_ONE);

exports.declare_initialize_meta = (scope, identifier, aran_expression) => {
  let counter = 0;
  const depth = Core.get_depth(scope);
  identifier += "_" + depth + "_";
  while (Core.is_declared(scope, meta(identifier + counter)) {
    counter++;
  }
  identifier = identifier + counter;
  const meta_aran_identifier = meta(identifierf);
  Core.declare(scope, meta_aran_identifier, null);
  return {
    __proto__: null,
    identifier,
    aran_expression: Core.initialize(scope, meta_aran_identifier, aran_expression);
  };
};

exports.lookup_meta = (scope, identifier, nullable_aran_expression) => Core.lookup(scope, meta(identifier), direct_callbacks, nullable_aran_expression);

//////////
// Base //
//////////

const indirect_callbacks = {
  __proto__: null,
  on_hit: ({scope, extended_identifier, callbacks:{on_initialized, on_deadzone}}, deadzone, {deadzone:nullable_identifier, tag:json}, access) => {
    if (deadzone === false) {
      return on_initialized(scope, extended_identifier, json, access);
    }
    // console.assert(nullable_identifier !== null);
    if (deadzone === true) {
      return on_deadzone(scope, extended_identifier);
    }
    return Build.conditional(
      Core.lookup(scope, meta(identifier), direct_callbacks, null),
      on_deadzone(scope, extended_identifier),
      on_initialized(scope, extended_identifier, tag, access));
  },
  on_miss: ({scope, extended_identifier, callbacks:{on_miss}}) => on_miss(scope, extended_identifier),
  on_dynamic: ({scope, extended_identifier, callbacks:{on_dynamic}}, aran_expression, dynamic) => on_dynamic(scope, extended_identifier, aran_expression, dynamic)
};

const base = (extended_identifier) => (
  extended_identifier === "new.target" ?
  "$0newtarget" :
  ("$" + extended_identifier));

const is_base = (aran_identifier) => aran_identifier[0] === "$";

const un_base = (base_aran_identifier) => (
  base_aran_identifier === "$0newtarget" :
  "new.target" :
  Reflect_apply(String_prototype_substring, base_aran_identifier, ARRAY_ONE));

exports.declare_base = (scope, extended_identifier, identifier, json) => {
  Core.declare(scope, base(extended_identifier), {
    __proto__: null,
    deadzone: identifier,
    tag: json
  });
};

exports.initialize_base = (scope, extended_identifier, aran_expression) => {
  const base_aran_identifier = base(extended_identifier);
  const meta_aran_identifier = meta(Core.get_tag(scope, base_aran_identifier).deadzone);
  if (Core.is_lookedup(scope, meta_aran_identifier)) {
    return Build.sequence(
      Core.initialize(scope, base_aran_identifier, aran_expression),
      Core.lookup(scope, meta_aran_identifier, direct_callbacks, Build.primitive(true)));
  }
  return Core.initialize(scope, base_aran_identifier, aran_expression);
};

exports.lookup_base = (scope, extended_identifier, callbacks) => Core.lookup(scope, base(extended_identifier), indirect_callbacks, {
  __proto__: null,
  scope,
  extended_identifier,
  callbacks
});

exports.build_block = (scope, predicates) => Core.build_block(scope, (aran_identifier, lookedup, initialized, tag) => {
  if (is_meta(aran_identifier)) {
    return predicates.meta(un_meta(aran_identifier), lookedup, initialized, tag);
  }
  if (is_base(aran_identifier)) {
    return predicates.meta(un_base(aran_identifier), lookedup, initialized, tag);
  }
  return predicate.para(un_para(aran_identifier), lookedup, initialized, tag);
});

exports.declare_initialize_base = (scope, extended_identifier, tag, aran_expression) => {
  const base_aran_identifier = base(extended_identifier);
  Core.declare(scope, base_aran_identifier, {
    __proto__: null,
    deadzone: null,
    tag
  });
  return Core.initialize(scope, base_aran_identifier, aran_expression);
};

exports.is_strict = Core.is_strict;

exports.extend = Core.extend;
