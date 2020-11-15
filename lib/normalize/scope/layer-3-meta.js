"use strict";

// Invariant hypothesis: `Split._declare_meta` and `Split.initialize_meta`, and `Split.lookup_meta` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Builtin) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Split = require("./layer-2-split.js");
const Tree = require("../tree.js");
const Stratum = require("../../stratum.js");
const Builtin = require("../builtin.js");

const BASE_IDENTIFIER_TYPE = 1;
const META_IDENTIFIER_TYPE = 2;
const PRIMITIVE_TYPE = 3;
const BUILTIN_TYPE = 4;

/* istanbul ignore next */
const deadcode = () => { throw new global_Error("This should never happen") };

////////////
// Intact //
////////////

global_Object_assign(exports, Split);

delete exports._is_writable_base;
delete exports._is_writable_meta;
delete exports._declare_meta;
delete exports.initialize_meta;
delete exports.lookup_meta;

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare_initialize_meta = (context, expression) => {
  const identifier = Split._declare_meta(context.scope, context.identifier, context.writable);
  return {
    remainder: Split.initialize_meta(context.scope, identifier, expression),
    box: {
      type: META_IDENTIFIER_TYPE,
      value: identifier,
    }
  };
};

const dispatch_callback_object_1 = {
  primitive: (scope, expression, primitive) => ({
    remainder: null,
    box: {
      type: PRIMITIVE_TYPE,
      value: primitive
    }
  }),
  builtin: (scope, expression, builtin) => ({
    remainder: null,
    box: {
      type: BUILTIN_TYPE,
      value: builtin
    }
  }),
  function: declare_initialize_meta,
  method: declare_initialize_meta,
  // read: declare_initialize_meta,
  read: (context, expression, stratified_stratified_identifier) => {
    /* istanbul ignore if */
    if (Stratum._is_meta(stratified_stratified_identifier)) {
      return declare_initialize_meta(context, expression);
    }
    // console.assert(Stratum._is_base(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
    const stratified_identifier = Stratum._get_body(stratified_stratified_identifier);
    const identifier = Stratum._get_body(stratified_identifier);
    if (Stratum._is_meta(stratified_identifier) ? Split._is_writable_meta(context.scope, identifier) : Split._is_writable_base(context.scope, identifier)) {
      return declare_initialize_meta(context, expression);
    }
    return {
      remainder: null,
      box: {
        type: Stratum._is_meta(stratified_identifier) ? META_IDENTIFIER_TYPE : BASE_IDENTIFIER_TYPE,
        value: Stratum._get_body(stratified_identifier)
      }
    };
  },
  // Consumers //
  write: (context, expression, identifier, right_expression) => ({
    remainder: expression,
    box: {
      type: PRIMITIVE_TYPE,
      value: void 0
    }
  }),
  sequence: (context, expression, first_expression, second_expression) => {
    const result = Tree._dispatch_expression(dispatch_callback_object_1, context, second_expression);
    return {
      remainder: result.remainder === null ? first_expression : Tree.sequence(first_expression, result.remainder),
      box: result.box
    };
  },
  conditional: declare_initialize_meta,
  throw: (context, expression, argument_expression) => ({
    remainder: expression,
    box: {
      type: PRIMITIVE_TYPE,
      value: "dummy-primitive-box"
    }
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
  const result = writable ? declare_initialize_meta(context, expression) : Tree._dispatch_expression(dispatch_callback_object_1, context, expression);
  return result.remainder === null ? optimistic_callback(result.box) : pessimistic_callback(result.remainder, result.box);
};

// type Callback = Box -> Expression
exports.box = (scope, identifier, writable, expression, callback) => {
  return make(scope, identifier, writable, expression, callback, (expression, box) => {
    return Tree.sequence(expression, callback(box));
  });
};

// type Callback = Box -> Statement
exports.Box = (scope, identifier, writable, expression, callback) => {
  return make(scope, identifier, writable, expression, callback, (expression, box) => {
    return Tree.Bundle([Tree.Lift(expression), callback(box)]);
  });
};

exports._primitive_box = (primitive) => ({
  type: PRIMITIVE_TYPE,
  value: primitive
});

exports._builtin_box = (builtin) => ({
  type: BUILTIN_TYPE,
  value: builtin
});

///////////////////
// Read && Write //
///////////////////

const lookup_callback_object = {
  on_live_hit: (context, writable, access) => {
    if (context === null || writable) {
      return access(context);
    }
    throw new global_Error("Cannot set a constant meta box");
  },
  on_dead_hit: deadcode,
  on_miss: deadcode,
  on_dynamic_frame: (context, frame, expression) => expression
};

exports.get = (scope, box) => {
  if (box.type === PRIMITIVE_TYPE) {
    return Tree.primitive(box.value);
  }
  if (box.type === BUILTIN_TYPE) {
    return Builtin.grab(box.value);
  }
  if (box.type === BASE_IDENTIFIER_TYPE) {
    return Split.lookup_base(scope, box.value, null, lookup_callback_object);
  }
  // console.assert(boc.type === META_IDENTIFIER_TYPE);
  return Split.lookup_meta(scope, box.value, null, lookup_callback_object);
};

exports.set = (scope, box, expression) => {
  if (box.type === META_IDENTIFIER_TYPE) {
    return Split.lookup_meta(scope, box.value, expression, lookup_callback_object);
  }
  throw new global_Error("Cannot set a primitive/builtin/base box");
};
