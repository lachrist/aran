"use strict";

// type DeadzoneIdentifier = Identifier
// 


const Core = require("./core.js");

const global_String_prototype_substring = global.String.prototype.substring;
const global_Reflect_apply = global.Reflect.apply;

const direct_callbacks = {
  __proto__: null,
  on_hit: (nullable_aran_expression, deadzone, lookedup, tag, access) => {
    // Invariant: (deadzone === false) && (tag === null)
    return access(nullable_aran_expression);
  },
  on_miss: (nullable_aran_expression) => {
    throw new global_Error("Missing direct identifier");
  },
  on_dynamic: (nullable_aran_expression, aran_expression, dynamic) => aran_expression
};

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

const param = (extended_identifier) => {
  if (extended_identifier in PARAMETERS) {
    return PARAMETERS[extended_identifier];
  }
  throw new global_Error("Invalid parameter name");
};

exports.declare_initialize_param = (scope, extended_identifier) => {
  if (extended_identifier in PARAMETERS) {
    const param_identifier = PARAMETERS[extended_identifier];
    Core.declare(scope, param_identifier, null);
    Core.initialize(scope, param_identifier, null);
    return null;
  }
  throw new global_Error("Invalid parameter name");
};

exports.lookup_param = (scope, extended_identifier, nullable_aran_expression) => Core.lookup(scope, param(extended_identifier), direct_callbacks, nullable_aran_expression);

//////////
// Meta //
//////////

const meta = (identifier) => "_" + identifier;

exports.declare_initialize_meta = (scope, identifier, aran_expression) => {
  let counter = 0;
  const depth = Core.get_depth(scope);
  identifier += "_" + depth + "_";
  while (Core.is_taken(scope, meta(identifier + counter)) {
    counter++;
  }
  identifier += counter;
  const meta_identifier = meta(identifier);
  Core.declare(scope, meta_identifier, null);
  return {
    __proto__: null,
    identifier,
    aran_expression: Core.initialize(scope, meta_identifier, aran_expression);
  };
};

exports.lookup_meta = (scope, identifier, nullable_aran_expression) => Core.lookup(scope, meta(identifier), DIRECT_CALLABACKS, nullable_aran_expression);

//////////
// Base //
//////////

const base = (extended_identifier) => extended_identifier === "new.target" ? "$0newtarget" : ("$" + extended_identifier)

const indirect_callbacks = {
  __proto__: null,
  on_hit: ({scope, extended_identifier, callbacks:{on_initialized, on_deadzone}}, deadzone, {sticker:identifier, tag}, access) => {
    if (deadzone === true) {
      return on_deadzone(scope, extended_identifier);
    }
    if (deadzone === false) {
      return on_initialized(scope, extended_identifier, tag, access);
    }
    return Build.conditional(
      Core.lookup(scope, meta(identifier), direct_callbacks, null),
      on_deadzone(scope, extended_identifier),
      on_initialized(scope, extended_identifier, tag, access));
  },
  on_miss: ({scope, extended_identifier, callbacks:{on_miss}}) => on_miss(scope, extended_identifier),
  on_dynamic: ({scope, extended_identifier, callbacks:{on_dynamic}}, aran_expression, dynamic) => on_dynamic(scope, extended_identifier, aran_expression, dynamic)
};

exports.declare_base = (scope, extended_identifier, identifier, tag) => {
  Core.declare(scope, base(extended_identifier), {
    __proto__: null,
    sticker: nullable_identifier,
    tag
  });
};

exports.is_direct_base = (scope, identifier) => Core.is_key_straight(scope, base(identifier));

exports.initialize_base = (scope, extended_identifier, aran_expression) => {
  const base_identifier = base(identifier);
  const meta_identifier = meta(Core.get_key_tag(scope, base_identifier).sticker);
  if (Core.is_key_lookedup(scope, meta_identifier)) {
    return Build.sequence(
      Core.initialize(scope, base_identifier, aran_expression),
      Core.lookup(scope, meta_identifier, direct_callbacks, Build.primitive(true)));
  }
  return Core.initialize(scope, base_identifier, aran_expression);
};

exports.lookup_base = (scope, extended_identifier, callbacks) => Core.lookup(scope, base(extended_identifier), indirect_callbacks, {
  __proto__: null,
  scope,
  extended_identifier,
  callbacks
});

// exports.declare_initialize_base = (scope, extended_identifier, tag, aran_expression) => {
//   const base_identifier = base(extended_identifier);
//   Core.declare(scope, base_identifier, {
//     __proto__: null,
//     tdz: null,
//     tag
//   });
//   return Core.initialize(scope, base_identifier, aran_expression);
// };
