"use strict";

const global_Reflect_ownKeys = global.Reflect.ownKeys;

const Tree = require("./tree.js");
const Throw = require("../throw.js");
const ArrayLite = require("array-lite");

const make_descriptor = (object) => Tree.ObjectExpression(
  Tree.PrimitiveExpression(null),
  ArrayLite.map(
    global_Reflect_ownKeys(object),
    (key) => (
      Throw.assert(typeof key === "string", null, "Invalid symbol property for descriptor"),
      [
        Tree.PrimitiveExpression(key),
        (
          typeof object[key] === "boolean" ?
          Tree.PrimitiveExpression(object[key]) :
          object[key])])));

const TARGET_RESULT = {__proto__:null};

const SUCCESS_RESULT = {__proto__:null};

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
          Tree.__intrinsic__("TypeError"),
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

exports._target_result = TARGET_RESULT;

exports._success_result = SUCCESS_RESULT;

const grabbable = [
  "aran.globalObjectRecord",
  "aran.globalDeclarativeRecord",
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

//////////////
// Gettable //
//////////////

exports.grab = (name) => (
  Throw.assert(ArrayLite.includes(grabbable, name), null, "Cannot grab intrinsic"),
  Tree.__intrinsic__(name));

////////////////
// Convertion //
////////////////

exports.string = (expression) => Tree.ApplyExpression(
  Tree.__intrinsic__("String"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

exports.fork_nullish = (closure, nullable_expression_1, nullable_expression_2) => Tree.ConditionalExpression(
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
      Tree.__intrinsic__("Object"),
      Tree.PrimitiveExpression(void 0),
      [closure()]) :
    nullable_expression_2));

exports.convert_to_array = (expression) => Tree.ApplyExpression(
  Tree.__intrinsic__("Array.from"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

exports.convert_to_object = (expression) => Tree.ApplyExpression(
  Tree.__intrinsic__("Object"),
  Tree.PrimitiveExpression(void 0),
  [expression]);

// // type Closure1 = () -> Expression
// // type Closure2 = () -> Expression
// // type Closure3 = (Expression) -> Expression
// exports.convert_to_object = (closure1, closure2, closure3) => Tree.ConditionalExpression(
//   Tree.ConditionalExpression(
//     Tree.BinaryExpression(
//       "===",
//       closure1(),
//       Tree.PrimitiveExpression(null)),
//     Tree.PrimitiveExpression(true),
//     Tree.BinaryExpression(
//       "===",
//       closure1(),
//       Tree.PrimitiveExpression(void 0))),
//   closure2(),
//   closure3(
//     Tree.ApplyExpression(
//       Tree.__intrinsic__("Object"),
//       Tree.PrimitiveExpression(void 0),
//       [
//         closure1()])));

//////////////////
// Construction //
//////////////////

exports.construct_symbol = (message) => Tree.ApplyExpression(
  Tree.__intrinsic__("Symbol"),
  Tree.PrimitiveExpression(void 0),
  [
    Tree.PrimitiveExpression(message)]);

exports.construct_object = (prototype, properties) => Tree.ObjectExpression(prototype, properties);

// ArrayLite.every(
//   properties,
//   (property) => (
//     "value" in property[1] &&
//     property[1].writable === true &&
//     property[1].enumerable === true &&
//     property[1].configurable === true)) ?
// Tree.ObjectExpression(
//   prototype,
//   ArrayLite.map(
//     properties,
//     (property) => [
//       property[0],
//       property[1].value])) :
// Tree.ApplyExpression(
//   Tree.__intrinsic__("Object.create"),
//   Tree.PrimitiveExpression(void 0),
//   [
//     prototype,
//     Tree.ObjectExpression(
//       Tree.PrimitiveExpression(null),
//       ArrayLite.map(
//         properties,
//         (property) => [
//           property[0],
//           make_descriptor(property[1])]))]));

exports.construct_array = (elements) => Tree.ApplyExpression(
  Tree.__intrinsic__("Array.of"),
  Tree.PrimitiveExpression(void 0),
  elements);

// type Target = Expression
// type Traps = [(String, Expression)]
exports.construct_proxy = (target, traps) => Tree.ConstructExpression(
  Tree.__intrinsic__("Proxy"),
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
exports.construct_regexp = (pattern, flags) => Tree.ConstructExpression(
  Tree.__intrinsic__("RegExp"),
  [
    Tree.PrimitiveExpression(pattern),
    Tree.PrimitiveExpression(flags)]);

// type Message = String
exports.throw_syntax_error = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__intrinsic__("SyntaxError"),
    [
      Tree.PrimitiveExpression(message)]));

// type Message = String
exports.throw_type_error = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__intrinsic__("TypeError"),
    [
      Tree.PrimitiveExpression(message)]));

// type Message = String
exports.throw_reference_error = (message) => Tree.ThrowExpression(
  Tree.ConstructExpression(
    Tree.__intrinsic__("ReferenceError"),
    [
      Tree.PrimitiveExpression(message)]));

/////////////////////////////////////////////////
// (Reflect && Object) >> Without Side Effects //
/////////////////////////////////////////////////

exports.apply = (target, ths, args) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.apply"),
  Tree.PrimitiveExpression(void 0),
  [target, ths, args]);

// type Newtarget = Maybe tree.Expression
exports.construct = (target, args, newtarget) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.construct"),
  Tree.PrimitiveExpression(void 0),
  (
    newtarget === null ?
    [target, args] :
    [target, args, newtarget]));

// type Receiver = Maybe tree.Expression
exports.get = (target, key, receiver) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.get"),
  Tree.PrimitiveExpression(void 0),
  (
    receiver === null ?
    [target, key] :
    [target, key, receiver]));

exports.get_own_property_descriptor = (target, key) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.getOwnPropertyDescriptor"),
  Tree.PrimitiveExpression(void 0),
  [target, key]);

exports.has = (target, key) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.has"),
  Tree.PrimitiveExpression(void 0),
  [target, key]);

exports.get_prototype_of = (target) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.getPrototypeOf"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.is_extensible = (target) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.isExtensible"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.own_keys = (target) => Tree.ApplyExpression(
  Tree.__intrinsic__("Reflect.ownKeys"),
  Tree.PrimitiveExpression(void 0),
  [target]);

exports.keys = (target) => Tree.ApplyExpression(
  Tree.__intrinsic__("Object.keys"),
  Tree.PrimitiveExpression(void 0),
  [target]);

// type Array = Expression
// type Start = Expression
// type End = Maybe Expression
exports.slice = (array, start, end) => Tree.ApplyExpression(
  Tree.__intrinsic__("Array.prototype.slice"),
  array,
  (
    end === null ?
    [start] :
    [start, end]));

exports.concat = (arrays) => Tree.ApplyExpression(
  Tree.__intrinsic__("Array.prototype.concat"),
  Tree.ApplyExpression(
    Tree.__intrinsic__("Array.of"),
    Tree.PrimitiveExpression(void 0),
    []),
  arrays);

exports.includes = (array, element) => Tree.ApplyExpression(
  Tree.__intrinsic__("Array.prototype.includes"),
  array,
  [element]);

///////////////////////////////////////////////////////
// (Reflect && Object && Array) >> With Side Effects //
///////////////////////////////////////////////////////

// Objec.defineProperty  // false TARGET_RESULT
// Reflect.defineProperty // false SUCCESS_RESULT
// Reflect.defineProperty ? expr : throw // true EXPR
// Reflect.defineProperty ? true : throw // true SUCCESS_RESULT
// (Reflect.defineProperty, expr) // false EXPR

exports.prevent_extensions = (target, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__intrinsic__("Object.preventExtensions"),
    Tree.PrimitiveExpression(void 0),
    [target]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__intrinsic__("Reflect.preventExtensions"),
      Tree.PrimitiveExpression(void 0),
      [target]),
    check,
    result,
    "Cannot prevent object extensions"));

exports.set_prototype_of = (target, prototype, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__intrinsic__("Object.setPrototypeOf"),
    Tree.PrimitiveExpression(void 0),
    [target, prototype]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__intrinsic__("Reflect.setPrototypeOf"),
      Tree.PrimitiveExpression(void 0),
      [target, prototype]),
    check,
    result,
    "Cannot set object prototype"));

exports.define_property = (target, key, descriptor, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.ApplyExpression(
    Tree.__intrinsic__("Object.defineProperty"),
    Tree.PrimitiveExpression(void 0),
    [
      target,
      key,
      make_descriptor(descriptor)]) :
  finalize_success(
    Tree.ApplyExpression(
      Tree.__intrinsic__("Reflect.defineProperty"),
      Tree.PrimitiveExpression(void 0),
      [
        target,
        key,
        make_descriptor(descriptor)]),
    check,
    result,
    "Cannot define object property"));

exports.set = (target, key, value, receiver, check, result) => finalize_success(
  Tree.ApplyExpression(
    Tree.__intrinsic__("Reflect.set"),
    Tree.PrimitiveExpression(void 0),
    (
      receiver === null ?
      [target, key, value] :
      [target, key, value, receiver])),
  check,
  result,
  "Cannot set object property");

exports.delete_property = (target, key, check, result) => finalize_success(
  Tree.ApplyExpression(
    Tree.__intrinsic__("Reflect.deleteProperty"),
    Tree.PrimitiveExpression(void 0),
    [target, key]),
  check,
  result,
  "Cannot delete object property");

exports.freeze = (target, check, result) => finalize_target(
  Tree.ApplyExpression(
    Tree.__intrinsic__("Object.freeze"),
    Tree.PrimitiveExpression(void 0),
    [target]),
  check,
  result);

exports.assign = (target, sources, check, result) => finalize_target(
  Tree.ApplyExpression(
    Tree.__intrinsic__("Object.assign"),
    Tree.PrimitiveExpression(void 0),
    ArrayLite.concat([target], sources)),
  check,
  result);

exports.fill = (array, element, start, end, check, result) => finalize_target(
  Tree.ApplyExpression(
    Tree.__intrinsic__("Array.prototype.fill"),
    array,
    (
      start === null ?
      (
        Throw.assert(end === null, null, "Array.prototype.fill: start cannot be null while end is not null"),
        [element]) :
      (
        end === null ?
        [element, start] :
        [element, start, end]))),
  check,
  result);

exports.push = (array, element, check, result) => (
  Throw.assert(result !== TARGET_RESULT, null, "push cannot return the target"),
  finalize_target(
    Tree.ApplyExpression(
      Tree.__intrinsic__("Array.prototype.push"),
      array,
      [element]),
    check,
    result));
