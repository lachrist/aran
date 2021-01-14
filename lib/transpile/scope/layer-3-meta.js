"use strict";

// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

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
const Identifier = require("../../identifier.js");
const Intrinsic = require("../intrinsic.js");

const TEST_TYPE = "Test";
const BASE_TYPE = "Base";
const META_TYPE = "Meta";
const PRIMITIVE_TYPE = "Primitive";
const INTRINSIC_TYPE = "Intrinsic";

/////////////
// Forward //
/////////////

exports.RootScope = Split.RootScope;
exports.ClosureScope = Split.ClosureScope;
exports.BindingScope = Split.BindingScope;
exports.fetchBinding = Split.fetchBinding;
exports.makeEvalExpression = Split.makeEvalExpression;
exports.makeInputExpression = Split.makeInputExpression;
exports.getDepth = Split.getDepth;

exports.isAvailable = Split.isAvailableBase;
exports.declare = Split.declareBase;
exports.initialize = Split.initializeBase;
exports.makeLookupExpression = Split.makeLookupBaseExpression;

////////////
// Extend //
////////////

exports.makeBlock = (scope, kinds, callback) => Split.makeBlock(
  scope,
  kinds,
  ["let", "const"],
  callback);

exports.DynamicScope = (scope, kinds, frame) => Split.DynamicScope(
  scope,
  kinds,
  [],
  frame);

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare = (scope, kind, identifier) => {
  identifier = identifier + "_" + Split.getDepth(scope) + "_";
  let counter = 1;
  // console.assert(Split.declareMeta(scope, kind, identifier).type === "static");
  while (Split.declareMeta(scope, {kind, ghost:false, name: identifier + global_String(counter)}).conflict !== null) {
    counter++;
  }
  return identifier + global_String(counter);
};

const declare_initialize = ({scope, kind, identifier}, expression) => {
  identifier = declare(scope, kind, identifier);
  return {
    // console.assert(Split.initializeMeta(scope, kind, identifier, expression).static === true);
    remainder: Split.initializeMeta(scope, kind, identifier, false).initialize(expression),
    box: {
      type: META_TYPE,
      value: identifier,
    }
  };
};

const callbacks = {
  __proto__: null,
  PrimitiveExpression: (scope, expression, primitive) => ({
    remainder: null,
    box: {
      type: PRIMITIVE_TYPE,
      value: primitive
    }
  }),
  IntrinsicExpression: (scope, expression, intrinsic) => ({
    remainder: null,
    box: {
      type: INTRINSIC_TYPE,
      value: intrinsic
    }
  }),
  WriteExpression: (context, expression, identifier, right_expression) => ({
    remainder: expression,
    box: {
      type: PRIMITIVE_TYPE,
      value: void 0
    }
  }),
  SequenceExpression: (context, expression, first_expression, second_expression) => {
    const result = Tree.dispatch(context, second_expression, callbacks, declare_initialize);
    return {
      remainder: result.remainder === null ? first_expression : Tree.SequenceExpression(first_expression, result.remainder),
      box: result.box
    };
  },
  ThrowExpression: (context, expression, argument_expression) => ({
    remainder: expression,
    box: {
      type: PRIMITIVE_TYPE,
      value: "dummy-primitive-box-value"
    }
  })
};

  // ReadExpression: (context, expression, stratified_stratified_identifier) => {
  //   /* istanbul ignore if */
  //   if (Identifier.IsMeta(stratified_stratified_identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   // console.assert(Identifier.IsBase(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
  //   const stratified_identifier = Identifier.GetBody(stratified_stratified_identifier);
  //   const identifier = Identifier.GetBody(stratified_identifier);
  //   if (Identifier.IsMeta(stratified_identifier) ? Split._is_writable_meta(context.scope, identifier) : Split._is_writable_base(context.scope, identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   return {
  //     remainder: null,
  //     box: {
  //       type: Identifier.IsMeta(stratified_identifier) ? META_TYPE : BASE_TYPE,
  //       value: Identifier.GetBody(stratified_identifier)
  //     }
  //   };
  // },

// type OptimisticCallback = (Expression, Box) -> A
// type PessimisticCallback = Box -> A
const make = (scope, writable, identifier, expression, optimistic_callback, pessimistic_callback) => { // A
  const context = {
    scope,
    kind: writable ? "let" : "const",
    identifier
  };
  const result = writable ? declare_initialize(context, expression) : Tree.dispatch(context, expression, callbacks, declare_initialize);
  return result.remainder === null ? optimistic_callback(result.box) : pessimistic_callback(result.remainder, result.box);
};

// type Callback = Box -> Expression
exports.makeBoxExpression = (scope, writable, identifier, expression, callback) => {
  return make(scope, writable, identifier, expression, callback, (expression, box) => {
    return Tree.SequenceExpression(expression, callback(box));
  });
};

// type Callback = Box -> Statement
exports.makeBoxStatement = (scope, writable, identifier, expression, callback) => {
  return make(scope, writable, identifier, expression, callback, (expression, box) => {
    return Tree.ListStatement([Tree.ExpressionStatement(expression), callback(box)]);
  });
};

exports.TestBox = (identifier) => ({
  type: TEST_TYPE,
  value: identifier
});

exports.PrimitiveBox = (primitive) => ({
  type: PRIMITIVE_TYPE,
  value: primitive
});

exports.IntrinsicBox = (intrinsic) => ({
  type: INTRINSIC_TYPE,
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
  on_static_dead_hit: Throw.DeadClosure("location"),
  on_miss: Throw.DeadClosure("location"),
  on_dynamic_frame: (frame, expression) => expression
};

exports.makeOpenExpression = (scope, box) => {
  if (box.type === PRIMITIVE_TYPE) {
    return Tree.PrimitiveExpression(box.value);
  }
  if (box.type === INTRINSIC_TYPE) {
    return Intrinsic.makeGrabExpression(box.value);
  }
  if (box.type === TEST_TYPE) {
    return Tree.__ReadExpression__(box.value);
  }
  // if (box.type === BASE_TYPE) {
  //   return Split.makeLookupBaseExpression(scope, box.value, null, lookup_callback_object);
  // }
  // console.assert(boc.type === META_TYPE);
  return Split.makeLookupMetaExpression(scope, box.value, lookup_callback_prototype);
};

exports.makeCloseExpression = (scope, box, expression) => {
  if (box.type === META_TYPE) {
    return Split.makeLookupMetaExpression(scope, box.value, {
      __proto__: lookup_callback_prototype,
      right: expression
    });
  }
  if (box.type === TEST_TYPE) {
    return Tree.__WriteExpression__(box.value, expression);
  }
  Throw.abort(null, `Cannot set a ${box.type} box`);
};
