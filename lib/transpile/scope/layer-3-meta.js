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
const Variable = require("../../variable.js");
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
exports.lookupAll = Split.lookupAll;
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

const declare_initialize = (context, expression) => {
  const identifier = declare(context.scope, context.kind, context.identifier);
  expression = context.prefix === null ? expression : Tree.SequenceExpression(context.prefix, expression);
  return {
    // console.assert(Split.initializeMeta(scope, kind, identifier, expression).static === true);
    postfix: Split.initializeMeta(context.scope, context.kind, identifier, false).initialize(expression),
    box: {
      type: META_TYPE,
      value: identifier,
    }
  };
};

const callbacks = {
  __proto__: null,
  PrimitiveExpression: (context, expression, primitive) => ({
    postfix: context.prefix,
    box: {
      type: PRIMITIVE_TYPE,
      value: primitive
    }
  }),
  IntrinsicExpression: (context, expression, intrinsic) => ({
    postfix: context.prefix,
    box: {
      type: INTRINSIC_TYPE,
      value: intrinsic
    }
  }),
  SequenceExpression: (context, expression, first_expression, second_expression) => {
    return Tree.dispatch({
      __proto__: context,
      prefix: context.prefix === null ? first_expression : Tree.SequenceExpression(context.prefix, first_expression)
    }, second_expression, callbacks, declare_initialize);
  },
  ThrowExpression: (context, expression, argument_expression) => ({
    postfix: context.prefix === null ? expression : Tree.SequenceExpression(context.prefix, expression),
    box: {
      type: PRIMITIVE_TYPE,
      value: "dummy-primitive-box-value"
    }
  })
};

  // ReadExpression: (context, expression, stratified_stratified_identifier) => {
  //   /* istanbul ignore if */
  //   if (Variable.IsMeta(stratified_stratified_identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   // console.assert(Variable.IsBase(stratified_stratified_identifier)); // read TDZ variables only appears in conditional expressions
  //   const stratified_identifier = Variable.GetBody(stratified_stratified_identifier);
  //   const identifier = Variable.GetBody(stratified_identifier);
  //   if (Variable.IsMeta(stratified_identifier) ? Split._is_writable_meta(context.scope, identifier) : Split._is_writable_base(context.scope, identifier)) {
  //     return declare_initialize(context, expression);
  //   }
  //   return {
  //     remainder: null,
  //     box: {
  //       type: Variable.IsMeta(stratified_identifier) ? META_TYPE : BASE_TYPE,
  //       value: Variable.GetBody(stratified_identifier)
  //     }
  //   };
  // },

// type OptimisticCallback = (Expression, Box) -> A
// type PessimisticCallback = Box -> A
const make = (scope, writable, identifier, expression, optimistic_callback, pessimistic_callback) => { // A
  const context = {
    scope,
    kind: writable ? "let" : "const",
    identifier,
    prefix: null
  };
  const result = writable ? declare_initialize(context, expression) : Tree.dispatch(context, expression, callbacks, declare_initialize);
  return result.postfix === null ? optimistic_callback(result.box) : pessimistic_callback(result.postfix, result.box);
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
