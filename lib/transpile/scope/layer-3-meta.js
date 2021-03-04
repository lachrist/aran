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
const Tree = require("../tree.js");
const Variable = require("../../variable.js");
const State = require("../state.js");
const Intrinsic = require("../intrinsic.js");
const Split = require("./layer-2-split.js");

const TEST_TYPE = "Test";
const LOCAL_TYPE = "Local";
const GLOBAL_TYPE = "Global";
const PRIMITIVE_TYPE = "Primitive";
const INTRINSIC_TYPE = "Intrinsic";

/////////////
// Forward //
/////////////

exports.RootScope = Split.RootScope;
exports.ClosureScope = Split.ClosureScope;
exports.PropertyScope = Split.PropertyScope;
exports.getPropertyValue = Split.getPropertyValue;
exports.makeEvalExpression = Split.makeEvalExpression;
exports.makeInputExpression = Split.makeInputExpression;
exports.makeBlock = Split.makeBlock;
exports.makeEmptyBlock = Split.makeEmptyBlock;
exports.DynamicScope = Split.DynamicScope;

exports.declareStaticVariable = Split.declareBaseStaticVariable;
exports.makeStaticInitializeExpression = Split.makeBaseStaticInitializeExpression;
exports.makeLookupExpression = Split.makeBaseLookupExpression;

/////////////
// Declare //
/////////////

const declare = (scope, identifier, writable) => (
  identifier = identifier + global_String(State.increment()),
  (
    Split.isRoot(scope) ?
    {
      type: GLOBAL_TYPE,
      data: identifier} :
    (
      Throw.assert(Split.isStatic(scope), null, `Cannot declare meta variable on dynamic scope`),
      Split.declareMetaStaticVariable(scope, identifier, false, writable),
      {
        type: LOCAL_TYPE,
        data: identifier})));

const initialize = (scope, box, expression) => (
  box.type === GLOBAL_TYPE ?
  Intrinsic.makeSetExpression(
    Intrinsic.makeGrabExpression("aran.globalRecord"),
    Tree.PrimitiveExpression(box.data),
    expression,
    null,
    false,
    Intrinsic.SUCCESS_RESULT) :
  // console.assert(box.type === LOCAL_TYPE)
  Split.makeMetaStaticInitializeExpression(scope, box.data, expression));

exports.makeBoxExpression = (scope, writable, identifier, expression, callback, _box) => (
  _box = declare(scope, identifier, writable),
  Tree.SequenceExpression(
    initialize(scope, _box, expression),
    callback(_box)));

exports.makeBoxStatement = (scope, writable, identifier, expression, callback, _box) => (
  _box = declare(scope, identifier, writable),
  Tree.ListStatement(
    [
      Tree.ExpressionStatement(
        initialize(scope, _box, expression)),
      callback(_box)]));

exports.TestBox = (identifier) => ({
  type: TEST_TYPE,
  data: identifier});

exports.PrimitiveBox = (primitive) => ({
  type: PRIMITIVE_TYPE,
  data: primitive});

exports.IntrinsicBox = (intrinsic) => ({
  type: INTRINSIC_TYPE,
  data: intrinsic});

///////////////////
// Read && Write //
///////////////////

const lookup_callback_prototype = {
  right: null,
  onStaticLiveHit: function (writable, read, write) { return (
      this.right === null ?
      read() :
      (
        Throw.assert(writable, null, `Cannot set a constant meta box`),
        write(this.right))); },
  onStaticDeadHit: Throw.DeadClosure("scope >> meta >> onStaticDeadHit"),
  onMiss: Throw.DeadClosure("scope >> meta >> onMiss"),
  onDynamicFrame: (expression, frame) => expression};

exports.makeOpenExpression = (scope, box) => (
  box.type === PRIMITIVE_TYPE ?
  Tree.PrimitiveExpression(box.data) :
  (
    box.type === INTRINSIC_TYPE ?
    Intrinsic.makeGrabExpression(box.data) :
    (
      box.type === LOCAL_TYPE ?
      Split.makeMetaLookupExpression(scope, box.data, lookup_callback_prototype) :
      (
        box.type === GLOBAL_TYPE ?
        Intrinsic.makeGetExpression(
          Intrinsic.makeGrabExpression("aran.globalRecord"),
          Tree.PrimitiveExpression(box.data),
          null) :
        // console.assert(box.type === TEST_TYPE)
        Tree.__ReadExpression__(box.data)))));

exports.makeCloseExpression = (scope, box, expression) => (
  box.type === LOCAL_TYPE ?
  Split.makeMetaLookupExpression(
    scope,
    box.data,
    {
      __proto__: lookup_callback_prototype,
      right: expression}) :
  (
    box.type === GLOBAL_TYPE ?
    Intrinsic.makeSetExpression(
      Intrinsic.makeGrabExpression("aran.globalRecord"),
      Tree.PrimitiveExpression(box.data),
      expression,
      null,
      false,
      Intrinsic.SUCCESS_RESULT) :
    (
      Throw.assert(box.type === TEST_TYPE, null, `Cannot set box`),
      Tree.__WriteExpression__(box.data, expression))));
