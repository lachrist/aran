"use strict";

const global_Symbol = global.Symbol;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;

const Tree = require("./tree.js");
const Throw = require("../throw.js");
const ArrayLite = require("array-lite");

const make_descriptor_key_array = ["value", "writable", "get", "set", "enumerable", "configurable"];
const make_descriptor = (object) => Tree.ObjectExpression(
  Tree.PrimitiveExpression(null),
  ArrayLite.map(
    ArrayLite.filter(
      make_descriptor_key_array,
      (key) => global_Reflect_getOwnPropertyDescriptor(object, key)),
    (key) => [
      Tree.PrimitiveExpression(key),
      (
        typeof object[key] === "boolean" ?
        Tree.PrimitiveExpression(object[key]) :
        object[key])]));

////////////
// Result //
////////////

const TARGET_RESULT = global_Symbol("target-result");

const SUCCESS_RESULT = global_Symbol("success-result");

exports.SUCCESS_RESULT = SUCCESS_RESULT;

exports.TARGET_RESULT = TARGET_RESULT;

const finalize_success = (expression, check, result, message) => (
  Throw.assert(result !== TARGET_RESULT, null, "Cannot return the target"),
  (
    check ?
    Tree.ConditionalExpression(
      expression,
      (
        result === SUCCESS_RESULT ?
        Tree.PrimitiveExpression(true) :
        result),
      Tree.ThrowExpression(
        Tree.ConstructExpression(
          Tree.__IntrinsicExpression__("TypeError"),
          [
            Tree.PrimitiveExpression(message)]))) :
    (
      result === SUCCESS_RESULT ?
      expression :
      Tree.SequenceExpression(expression, result))));

const finalize_target = (expression, check, result) => (
  Throw.assert(check, null, "Must check the result"),
  (
    result === TARGET_RESULT ?
    expression :
    Tree.SequenceExpression(
      expression,
      (
        result === SUCCESS_RESULT ?
        Tree.PrimitiveExpression(true) :
        result))));

//////////
// Grab //
//////////

const grabbable = [
  "aran.globalRecord",
  "aran.generatorPrototype",
  "aran.asynchronousGeneratorPrototype",
  "aran.deadzoneMarker",
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap
  "eval",
  "Symbol.unscopables",
  "Symbol.asyncIterator",
  "Symbol.iterator",
  "Symbol.isConcatSpreadable",
  "Function.prototype.arguments@get",
  "Function.prototype.arguments@set",
  "Array.prototype.values",
  "Object.prototype"];

exports.makeGrabExpression = (name) => (
  Throw.assert(ArrayLite.includes(grabbable, name), null, "Cannot grab intrinsic"),
  Tree.__IntrinsicExpression__(name));

////////////////
// Convertion //
////////////////

exports.makeStringExpression = (expression) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("String"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

exports.makeNullishExpression = (closure, nullable_expression_1, nullable_expression_2) => Tree.ConditionalExpression(
  Tree.ConditionalExpression(
    Tree.BinaryExpression(
      "===",
      closure(),
      Tree.PrimitiveExpression(null)),
    Tree.PrimitiveExpression(true),
    Tree.BinaryExpression(
      "===",
      closure(),
      Tree.PrimitiveExpression(void 0))),
  (
    nullable_expression_1 === null ?
    closure() :
    nullable_expression_1),
  (
    nullable_expression_2 === null ?
    Tree.ApplyExpression(
      Tree.__IntrinsicExpression__("Object"),
      Tree.PrimitiveExpression(void 0),
      [closure()]) :
    nullable_expression_2));

exports.makeArrayifyExpression = (expression) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Array.from"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

exports.makeObjectifyExpression = (expression) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Object"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

//////////////////
// Construction //
//////////////////

exports.makeSymbolExpression = (message) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Symbol"),
  Tree.PrimitiveExpression(void 0),
  [
    Tree.PrimitiveExpression(message)]);

exports.makeObjectExpression = (prototype, properties) => Tree.ObjectExpression(prototype, properties);

exports.makeArrayExpression = (elements) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Array.of"),
  Tree.PrimitiveExpression(void 0),
  elements);

// type Target = Expression
// type Traps = [(String, Expression)]
exports.makeProxyExpression = (target, traps) => Tree.ConstructExpression(
  Tree.__IntrinsicExpression__("Proxy"),
  [
    target,
    Tree.ObjectExpression(
      Tree.PrimitiveExpression(null),
      ArrayLite.map(
        traps,
        (trap) => [
          Tree.PrimitiveExpression(trap[0]),
          trap[1]]))]);

// type Pattern = String
// type Flags = String
exports.makeRegExpExpression = (pattern, flags) => Tree.ConstructExpression(
  Tree.__IntrinsicExpression__("RegExp"),
  [
    Tree.PrimitiveExpression(pattern),
    Tree.PrimitiveExpression(flags)]);

// type Message = String
exports.makeThrowSyntaxErrorExpression = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__IntrinsicExpression__("SyntaxError"),
    [
      Tree.PrimitiveExpression(message)]));

// type Message = String
exports.makeThrowTypeErrorExpression = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__IntrinsicExpression__("TypeError"),
    [
      Tree.PrimitiveExpression(message)]));

// type Message = String
exports.makeThrowReferenceErrorExpression = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__IntrinsicExpression__("ReferenceError"),
    [
      Tree.PrimitiveExpression(message)]));

/////////////////////////////////////////////////
// (Reflect && Object) >> Without Side Effects //
/////////////////////////////////////////////////

exports.makeApplyExpression = (target, ths, args) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.apply"),
  Tree.PrimitiveExpression(void 0),
  [target, ths, args]);

// type Newtarget = Maybe tree.Expression
exports.makeConstructExpression = (target, args, newtarget) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.construct"),
  Tree.PrimitiveExpression(void 0),
  (
    newtarget === null ?
    [target, args] :
    [target, args, newtarget]));

// type Receiver = Maybe tree.Expression
exports.makeGetExpression = (target, key, receiver) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.get"),
  Tree.PrimitiveExpression(void 0),
  (
    receiver === null ?
    [target, key] :
    [target, key, receiver]));

exports.makeGetOwnPropertyDescriptorExpression = (target, key) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.getOwnPropertyDescriptor"),
  Tree.PrimitiveExpression(void 0),
  [target, key]);

exports.makeHasExpression = (target, key) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.has"),
  Tree.PrimitiveExpression(void 0),
  [target, key]);

exports.makeGetPrototypeOfExpression = (target) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.getPrototypeOf"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.makeIsExtensibleExpression = (target) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.isExtensible"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.makeOwnKeysExpression = (target) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Reflect.ownKeys"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.makeKeysExpression = (target) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Object.keys"),
  Tree.PrimitiveExpression(void 0),
  [target]);

// type Array = Expression
// type Start = Expression
// type End = Maybe Expression
exports.makeSliceExpression = (array, start, end) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Array.prototype.slice"),
  array,
  (
    end === null ?
    [start] :
    [start, end]));

exports.makeConcatExpression = (arrays) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Array.prototype.concat"),
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Array.of"),
    Tree.PrimitiveExpression(void 0),
    []),
  arrays);

exports.makeIncludesExpression = (array, element) => Tree.ApplyExpression(
  Tree.__IntrinsicExpression__("Array.prototype.includes"),
  array,
  [element]);

///////////////////////////////////////////////////////
// (Reflect && Object && Array) >> With Side Effects //
///////////////////////////////////////////////////////

exports.makePreventExtensionsExpression = (target, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Object.preventExtensions"),
    Tree.PrimitiveExpression(void 0),
    [target]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__IntrinsicExpression__("Reflect.preventExtensions"),
      Tree.PrimitiveExpression(void 0),
      [target]),
    check,
    result,
    "Cannot prevent object extensions"));

exports.makeSetPrototypeOfExpression = (target, prototype, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Object.setPrototypeOf"),
    Tree.PrimitiveExpression(void 0),
    [target, prototype]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__IntrinsicExpression__("Reflect.setPrototypeOf"),
      Tree.PrimitiveExpression(void 0),
      [target, prototype]),
    check,
    result,
    "Cannot set object prototype"));

exports.makeDefinePropertyExpression = (target, key, descriptor, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Object.defineProperty"),
    Tree.PrimitiveExpression(void 0),
    [
      target,
      key,
      make_descriptor(descriptor)]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__IntrinsicExpression__("Reflect.defineProperty"),
      Tree.PrimitiveExpression(void 0),
      [
        target,
        key,
        make_descriptor(descriptor)]),
    check,
    result,
    "Cannot define object property"));

exports.makeSetExpression = (target, key, value, receiver, check, result) => finalize_success(
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Reflect.set"),
    Tree.PrimitiveExpression(void 0),
    (
      receiver === null ?
      [target, key, value] :
      [target, key, value, receiver])),
  check,
  result,
  "Cannot set object property");

exports.makeDeletePropertyExpression = (target, key, check, result) => finalize_success(
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Reflect.deleteProperty"),
    Tree.PrimitiveExpression(void 0),
    [target, key]),
  check,
  result,
  "Cannot delete object property");

exports.makeFreezeExpression = (target, check, result) => finalize_target(
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Object.freeze"),
    Tree.PrimitiveExpression(void 0),
    [target]),
  check,
  result);

exports.makeAssignExpression = (target, sources, check, result) => finalize_target(
  Tree.ApplyExpression(
    Tree.__IntrinsicExpression__("Object.assign"),
    Tree.PrimitiveExpression(void 0),
    ArrayLite.concat([target], sources)),
  check,
  result);
