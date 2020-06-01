
"use strict";

// Invariant hypothesis: `Outer._declare_meta` and `Outer.initialize_meta`, and `Outer.lookup_meta` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Builtin) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression
// type Context = Maybe Expression

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring

const ArrayLite = require("array-lite");
const Outer = require("./outer.js");
const Lang = require("../lang.js");
const Stratum = require("./stratum.js");

const global_Error = global.Error;

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare_initialize_meta = (context, expression) => {
  const identifier = Outer._declare_meta(context.scope, context.identifier, context.writable);
  return {
    remainder: Outer.initialize_meta(context.scope, identifier, expression),
    box: "_" + identifier
  };
};

const dispatch_callbacks = {
  primitive: (scope, expression, primitive) => ({
    remainder: null,
    box: typeof primitive === "string" ? "@" + primitive : primitive
  }),
  builtin: (scope, expression, name) => ({
    remainder: null,
    box: "#" + name
  }),
  arrow: declare_initialize_meta,
  function: declare_initialize_meta,
  read: (context, expression, stratified_stratified_identifier) => {
    // console.assert(Stratum._is_base(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
    const stratified_identifier = Stratum._get_body(stratified_stratified_identifier);
    const identifier = Stratum._get_body(stratified_identifier);
    if (Outer[Stratum._is_meta(stratified_identifier) ? "_is_writable_meta" : "_is_writable_base"](context.scope, identifier)) {
      return declare_initialize_meta(context, expression);
    }
    return {
      remainder: null,
      box: (Stratum._is_meta(stratified_identifier) ? "_" : "$") + Stratum._get_body(stratified_identifier)
    };
  },
  // Consumers //
  write: (context, expression, identifier, right_expression) => ({
    remainder: expression,
    box: void 0
  }),
  sequence: (context, expression, first_expression, second_expression) => {
    const result = Lang._dispatch_expression(second_expression, context, dispatch_callbacks);
    return {
      remainder: result.remainder === null ? first_expression : Lang.sequence(first_expression, result.remainder),
      box: result.box
    };
  },
  conditional: declare_initialize_meta,
  throw: (context, expression, argument_expression) => ({
    remainder: expression,
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

// type OptimisticCallback = (Expression, Box) -> A
// type PessimisticCallback = Box -> A
const make = (scope, identifier, writable, expression, optimistic_callback, pessimistic_callback) => { // A
  const context = {scope, identifier, writable};
  const result = writable ? declare_initialize_meta(context, expression) : Lang._dispatch_expression(expression, context, dispatch_callbacks);
  return result.remainder === null ? optimistic_callback(result.box) : pessimistic_callback(result.remainder, result.box);
};

// type Callback = Box -> Expression 
exports.box = (scope, identifier, writable, expression, callback) => {
  return make(scope,identifier,  writable, expression, callback, (expression, box) => {
    return Lang.sequence(expression, callback(box));
  });
};

// type Callback = Box -> Statement
exports.Box = (scope, identifier, writable, expression, callback) => {
  return make(scope, identifier, writable, expression, callback, (expression, box) => {
    return Lang.Bundle([Lang.Lift(expression), callback(box)]);
  });
};

///////////////////
// Read && Write //
///////////////////

const ONE = [1];

const lookup_callbacks = {
  on_live_hit: (nullable_expression, writable, access) => {
    if (!writable && nullable_expression !== null) {
      throw new global_Error("Cannot set a constant box");
    }
    return access(nullable_expression);
  },
  on_dead_hit: /* istanbul ignore next */ (nullable_expression, wriable) => {
    // console.assert(false);
  },
  on_miss: /* istanbul ignore next */ (nullable_expression) => {
    // console.assert(false);
  },
  on_dynamic_frame: (nullable_expression, dynamic, expression) => expression
};

exports.get = (scope, box) => {
  if (typeof box !== "string") {
    return Lang.primitive(box);
  }
  if (box[0] === "#") {
    return Lang.builtin(global_Reflect_apply(global_String_prototype_substring, box, ONE));
  }
  if (box[0] === "@") {
    return Lang.primitive(global_Reflect_apply(global_String_prototype_substring, box, ONE));
  }
  if (box[0] === "_") {
    return Outer.lookup_meta(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), null, lookup_callbacks);
  }
  /* istanbul ignore else */
  if (box[0] === "$") {
    return Outer.lookup_base(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), null, lookup_callbacks);
  }
  // console.assert(false);
};

exports.set = (scope, box, expression) => {
  if (typeof box !== "string" || box[0] === "@") {
    throw new global_Error("Cannot set a primitive box");
  }
  if (box[0] === "#" ) {
    throw new global_Error("Cannot set a builtin box");
  }
  if (box[0] === "_") {
    return Outer.lookup_meta(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), expression, lookup_callbacks);
  }
  /* istanbul ignore else */
  if (box[0] === "$") {
    return Outer.lookup_base(scope, global_Reflect_apply(global_String_prototype_substring, box, ONE), expression, lookup_callbacks);
  }
  // console.assert(false);
};
