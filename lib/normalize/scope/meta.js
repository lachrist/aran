
"use strict";

// Invariant hypothesis: `Core._declare`, `Core.initialize`, and `Core.lookup` are only access in `Meta` and `Base`. 
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type MetaIdentifier = <Strings which are valid JS identifier that starts with a `_`>
// type Box = Either MetaIdentifier Primitive
// 
// type Result = (Remainder, Box)
// type Remainder = Maybe AranExpression

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring

const ArrayLite = require("array-lite");
const Core = require("./core.js");
const Lang = require("../lang.js");

const global_Error = global.Error;

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare_initialize_meta = (context, aran_expression) => {
  const identifier = Outside._declare_meta(context.scope, context.identifier, context.writable);
  return {
    remainder: Outside.initialize_meta(scope, identifier, either_primitive_aran_expression),
    box: "_" + identifier
  };
};

const dispatch_callbacks = {
  primitive: (scope, aran_expression, primitive) => ({
    remainder: null,
    box: typeof primitive === "string" ? "@" + primitive : primitive
  }),
  builtin: (scope, aran_expression, name) => ({
    remainder: null,
    box: "#" + name
  }),
  arrow: declare_initialize_meta,
  function: declare_initialize_meta,
  read: (context, aran_expression, stratified_stratified_identifier) => {
    if (Stratum._is_meta(stratified_stratified_identifier)) {
      return declare_initialize_meta(context, aran_expression);
    }
    const stratified_identifier = Stratum._get_body(stratified_stratified_identifier);
    const identifier = Stratum._get_body(stratified_identifier);
    if (Outside[Stratum._is_meta(stratified_identifier) ? "_is_writable_meta" : "_is_writable_base"](context.scope, identifier)) {
      return declare_initialize_meta(context, aran_expression);
    }
    return {
      remainder: null,
      box: (Stratum._is_meta(stratified_identifier) ? "_" : "$") + Stratum._get_body(stratified_identifier)
    };
  },
  // Consumers //
  write: (context, aran_expression, identifier, right_aran_expression) => ({
    remainder: aran_expression,
    box: void 0
  }),
  sequence: (context, aran_expression, first_aran_expression, second_aran_expression) => {
    const result = Lang._dispatch_expression(second_aran_expression, context, callbacks);
    return {
      remainder: result.remainder === null ? first_aran_expression : Build.sequence(first_aran_expression, result.remainder),
      box: result.box
    };
  },
  conditional: declare_initialize_meta,
  throw: (context, aran_expression, argument_aran_expression) => ({
    remainder: aran_expression,
    box: void 0
  }),
  eval: declare_initialize_meta,
  // Combiners //
  apply: declare_initialize_meta,
  construct: declare_initialize_meta,
  unary: declare_initialize_meta,
  binary: declare_initialize_meta,
  object: declare_initialize_meta
};

const make = (scope, identifier, writable, aran_expression, callback1, callback2) => {
  const context = {scope, identifier, writable};
  const result = writable ? declare_initialize_meta(context, aran_expression) : Lang._dispatch_expression(aran_expression, context, callbacks);
  return result.remainder === null ? callback1(result.box) : callback2(result.remainder, result.box);
};

exports.box = (scope, identifier, writable, aran_expression, callback) => {
  return make(scope, identifier, writable, aran_expression, callback, (aran_expression, box) => {
    return Build.sequence(aran_expression, callback(box));
  });
};

exports.Box = (scope, identifier, writable, aran_expression, callback) => {
  return make(scope, identifier, writable, aran_expression, callback, (aran_expression, box) => {
    return Lang.Bundle([Build.Lift(aran_expression), callback(box)]);
  });
};

///////////////////
// Read && Write //
///////////////////

const ONE = [1];

const lookup_callbacks = {
  on_live_hit: (nullable_aran_expression, writable, access) => {
    if (!writable && nullable_aran_expression !== null) {
      throw new global_Error("Writing to a constant box");
    }
    return access(nullable_aran_expression);
  },
  on_dead_hit: /* istanbul ignore next */ (nullable_aran_expression, wriable) => {
    // console.assert(false);
  },
  on_miss: /* istanbul ignore next */ (nullable_aran_expression) => {
    // console.assert(false);
  },
  on_dynamic_frame: (nullable_aran_expression, dynamic, aran_expression) => aran_expression
};

exports.get = (scope, box) => {
  if (typeof box !== "string") {
    return Build.primitive(box);
  }
  if (box[0] === "#") {
    return Build.builtin(global_Reflect_apply(global_String_prototype_substring, box, ONE));
  }
  if (box[0] === "@") {
    return Build.primitive(global_Reflect_apply(global_String_prototype_substring, box, ONE));
  }
  if (box[0] === "_") {
    return Core.lookup_meta(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), null, lookup_callbacks);
  }
  /* istanbul ignore else */
  if (box[0] === "$") {
    return Core.lookup_base(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), null, lookup_callbacks);
  }
  // console.assert(false);
};

exports.set = (scope, box, aran_expression) => {
  if (typeof box !== "string" || box[0] === "#" || box[0] === "@") {
    throw new global_Error("Cannot set a primitive box");
  }
  if (box[0] === "_") {
    return Core.lookup_meta(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), aran_expression, callbacks);
  }
  /* istanbul ignore else */
  if (box[0] === "$") {
    return Core.lookup_base(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), aran_expression, callbacks);
  }
  // console.assert(false);
};
