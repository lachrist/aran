"use strict";

// Invariant hypothesis: `Outer._declare_meta` and `Outer.initialize_meta`, and `Outer.lookup_meta` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Builtin) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

const ArrayLite = require("array-lite");
const Outer = require("./outer.js");
const Tree = require("../tree.js");
const Stratum = require("../../stratum.js");
const Builtin = require("../builtin.js");

const global_Error = global.Error;

const BASE_IDENTIFIER_TYPE = 1;
const META_IDENTIFIER_TYPE = 2;
const PRIMITIVE_TYPE = 3;
const BUILTIN_TYPE = 4;

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare_initialize_meta = (context, expression) => {
  const identifier = Outer._declare_meta(context.scope, context.identifier, context.writable);
  return {
    remainder: Outer.initialize_meta(context.scope, identifier, expression),
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
  read: declare_initialize_meta,
  // read: (context, expression, stratified_stratified_identifier) => {
  //   // console.assert(Stratum._is_base(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
  //   const stratified_identifier = Stratum._get_body(stratified_stratified_identifier);
  //   const identifier = Stratum._get_body(stratified_identifier);
  //   if (Stratum._is_meta(stratified_identifier) ? Outer._get_tag_meta(context.scope, identifier) : Outer._get_tag_base(context.scope, identifier)) {
  //     return {
  //       remainder: null,
  //       box: {
  //         type: Stratum._is_meta(stratified_identifier) ? META_IDENTIFIER_TYPE : BASE_IDENTIFIER_TYPE,
  //         value: Stratum._get_body(stratified_identifier)
  //       }
  //     };
  //   }
  //   return declare_initialize_meta(context, expression);
  // },
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
  return make(scope,identifier, writable, expression, callback, (expression, box) => {
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

// const interrupt = () => {
//   throw new global_Error("Scope._box can only box primitive expressions or builtin expressions");
// }
// const dispatch_callback_object_2 = {
//   primitive: (scope, expression, primitive) => ({
//     type: PRIMITIVE_TYPE,
//     value: primitive
//   }),
//   builtin: (scope, expression, builtin) => ({
//     type: BUILTIN_TYPE,
//     value: builtin
//   }),
//   function: interrupt,
//   method: interrupt,
//   read: interrupt,
//   // Consumers //
//   write: interrupt,
//   sequence: interrupt,
//   conditional: interrupt,
//   throw: interrupt,
//   eval: interrupt,
//   // Combiners //
//   apply: interrupt,
//   construct: interrupt,
//   unary: interrupt,
//   binary: interrupt,
//   object: interrupt
// };
// exports._box = (scope, identifier, writable, expression) => {
//   if (writable) {
//     throw new global_Error("Scope._box cannot create writable boxes");
//   }
//   return Tree._dispatch_expression(dispatch_callback_object_2, null, expression);
// };

///////////////////
// Read && Write //
///////////////////

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
  if (box.type === PRIMITIVE_TYPE) {
    return Tree.primitive(box.value);
  }
  if (box.type === BUILTIN_TYPE) {
    return Builtin.grab(box.value);
  }
  // if (box.type === META_IDENTIFIER_TYPE) {
  //   return Outer.lookup_meta(scope, box.value, null, lookup_callbacks);
  // }
  // console.assert(boc.type === META_IDENTIFIER_TYPE);
  return Outer.lookup_meta(scope, box.value, null, lookup_callbacks);
  //
  /* istanbul ignore else */
  // if (box.type === BASE_IDENTIFIER_TYPE) {
  //   return Outer.lookup_base(scope, box.value, null, lookup_callbacks);
  // }
  // console.assert(false);
};

exports.set = (scope, box, expression) => {
  if (box.type === META_IDENTIFIER_TYPE) {
    return Outer.lookup_meta(scope, box.value, expression, lookup_callbacks);
  }
  // if (box.type === BASE_IDENTIFIER_TYPE) {
  //   return Outer.lookup_base(scope, box.value, expression, lookup_callbacks);
  // }
  throw new global_Error("Cannot set a primitive/builtin box");
};
