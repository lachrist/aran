"use strict";

// Invariant hypothesis: `Split._declare_meta` and `Split.initialize_meta`, and `Split.lookup_meta` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

const global_String = global.String;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Split = require("./layer-2-split.js");
const Tree = require("../tree.js");
const Stratum = require("../../stratum.js");
const Intrinsic = require("../intrinsic.js");

const TEST_IDENTIFIER_TYPE = "test";
const BASE_IDENTIFIER_TYPE = "base";
const META_IDENTIFIER_TYPE = "meta";
const PRIMITIVE_TYPE = "primitive";
const BUILTIN_TYPE = "intrinsic";

/////////////
// Forward //
/////////////

exports._make_root = Split._make_root;
exports._extend_closure = Split._extend_closure;
exports._extend_binding = Split._extend_binding;
exports._get_binding = Split._get_binding;
exports.eval = Split.eval;
exports.input = Split.input;

exports._is_available = Split._is_available_base;
exports._declare = Split._declare_base;
exports._initialize = Split._initialize_base;
exports.lookup = Split.lookup_base;

////////////
// Extend //
////////////

exports.EXTEND_STATIC = (scope, kinds, callback) => Split.EXTEND_STATIC(
  scope,
  kinds,
  ["let", "const"],
  callback);

exports._extend_dynamic = (scope, kinds, frame) => Split._extend_dynamic(
  scope,
  kinds,
  [],
  frame);

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare = (scope, kind, identifier) => {
  identifier = identifier + "_" + Split._get_depth(scope) + "_";
  let counter = 1;
  // console.assert(Split._declare_meta(scope, kind, identifier).static === true);
  while (Split._declare_meta(scope, {kind, ghost:false, name: identifier + global_String(counter)}).conflict !== null) {
    counter++;
  }
  return identifier + global_String(counter);
};

const declare_initialize = ({scope, kind, identifier}, expression) => {
  identifier = declare(scope, kind, identifier);
  return {
    // console.assert(Split._initialize_meta(scope, kind, identifier, expression).static === true);
    remainder: Split._initialize_meta(scope, kind, identifier, false).initialize(expression),
    box: {
      type: META_IDENTIFIER_TYPE,
      value: identifier,
    }
  };
};

const callbacks = {
  primitive: (scope, expression, primitive) => ({
    remainder: null,
    box: {
      type: PRIMITIVE_TYPE,
      value: primitive
    }
  }),
  intrinsic: (scope, expression, intrinsic) => ({
    remainder: null,
    box: {
      type: BUILTIN_TYPE,
      value: intrinsic
    }
  }),
  function: declare_initialize,
  method: declare_initialize,
  read: declare_initialize,
  require: declare_initialize,
  import: declare_initialize,
  // read: (context, expression, stratified_stratified_identifier) => {
  //   /* istanbul ignore if */
  //   if (Stratum._is_meta(stratified_stratified_identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   // console.assert(Stratum._is_base(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
  //   const stratified_identifier = Stratum._get_body(stratified_stratified_identifier);
  //   const identifier = Stratum._get_body(stratified_identifier);
  //   if (Stratum._is_meta(stratified_identifier) ? Split._is_writable_meta(context.scope, identifier) : Split._is_writable_base(context.scope, identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   return {
  //     remainder: null,
  //     box: {
  //       type: Stratum._is_meta(stratified_identifier) ? META_IDENTIFIER_TYPE : BASE_IDENTIFIER_TYPE,
  //       value: Stratum._get_body(stratified_identifier)
  //     }
  //   };
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
    const result = Tree._dispatch(context, second_expression, callbacks);
    return {
      remainder: result.remainder === null ? first_expression : Tree.sequence(first_expression, result.remainder),
      box: result.box
    };
  },
  conditional: declare_initialize,
  throw: (context, expression, argument_expression) => ({
    remainder: expression,
    box: {
      type: PRIMITIVE_TYPE,
      value: "dummy-primitive-box"
    }
  }),
  eval: declare_initialize,
  // Combiners //
  apply: declare_initialize,
  construct: declare_initialize,
  unary: declare_initialize,
  binary: declare_initialize,
  object: declare_initialize
};

// type OptimisticCallback = (Expression, Box) -> A
// type PessimisticCallback = Box -> A
const make = (scope, writable, identifier, expression, optimistic_callback, pessimistic_callback) => { // A
  const context = {
    scope,
    kind: writable ? "let" : "const",
    identifier
  };
  const result = writable ? declare_initialize(context, expression) : Tree._dispatch(context, expression, callbacks);
  return result.remainder === null ? optimistic_callback(result.box) : pessimistic_callback(result.remainder, result.box);
};

// type Callback = Box -> Expression
exports.box = (scope, writable, identifier, expression, callback) => {
  return make(scope, writable, identifier, expression, callback, (expression, box) => {
    return Tree.sequence(expression, callback(box));
  });
};

// type Callback = Box -> Statement
exports.Box = (scope, writable, identifier, expression, callback) => {
  return make(scope, writable, identifier, expression, callback, (expression, box) => {
    return Tree.Bundle([Tree.Lift(expression), callback(box)]);
  });
};

exports._test_box = (identifier) => ({
  type: TEST_IDENTIFIER_TYPE,
  value: identifier
});

exports._primitive_box = (primitive) => ({
  type: PRIMITIVE_TYPE,
  value: primitive
});

exports._intrinsic_box = (intrinsic) => ({
  type: BUILTIN_TYPE,
  value: intrinsic
});

///////////////////
// Read && Write //
///////////////////

const lookup_callback_prototype = {
  right: null,
  on_static_live_hit: function (variable, read, write) {
    if (this.right === null) {
      return read();
    }
    if (variable.kind === "let") {
      return write(this.right);
    }
    Throw.abort(null, `Cannot set a constant meta box`);
  },
  on_static_dead_hit: Throw.deadcode,
  on_miss: Throw.deadcode,
  on_dynamic_frame: (frame, expression) => expression
};

exports.get = (scope, box) => {
  if (box.type === PRIMITIVE_TYPE) {
    return Tree.primitive(box.value);
  }
  if (box.type === BUILTIN_TYPE) {
    return Intrinsic.grab(box.value);
  }
  if (box.type === TEST_IDENTIFIER_TYPE) {
    return Tree.__read__(box.value);
  }
  // if (box.type === BASE_IDENTIFIER_TYPE) {
  //   return Split.lookup_base(scope, box.value, null, lookup_callback_object);
  // }
  // console.assert(boc.type === META_IDENTIFIER_TYPE);
  return Split.lookup_meta(scope, box.value, lookup_callback_prototype);
};

exports.set = (scope, box, expression) => {
  if (box.type === META_IDENTIFIER_TYPE) {
    return Split.lookup_meta(scope, box.value, {
      __proto__: lookup_callback_prototype,
      right: expression
    });
  }
  if (box.type === TEST_IDENTIFIER_TYPE) {
    return Tree.__write__(box.value, expression);
  }
  Throw.abort(null, `Cannot set a non-meta box`);
};
