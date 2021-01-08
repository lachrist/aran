"use strict";

const global_Reflect_ownKeys = global.Reflect.ownKeys;

const Tree = require("./tree.js");
const Throw = require("../throw.js");
const ArrayLite = require("array-lite");

const make_descriptor = (object) => Tree.object(
  Tree.primitive(null),
  ArrayLite.map(
    global_Reflect_ownKeys(object),
    (key) => (
      Throw.assert(typeof key === "string", null, "Invalid symbol property for descriptor"),
      [
        Tree.primitive(key),
        (
          typeof object[key] === "boolean" ?
          Tree.primitive(object[key]) :
          object[key])])));

const TARGET_RESULT = {__proto__:null};

const SUCCESS_RESULT = {__proto__:null};

const finalize_success = (expression, check, result, message) => (
  Throw.assert(result !== TARGET_RESULT, null, "Cannot return the target"),
  (
    check ?
    Tree.conditional(
      expression,
      (
        result === SUCCESS_RESULT ?
        Tree.primitive(true) :
        result),
      Tree.throw(
        Tree.construct(
          Tree.__intrinsic__("TypeError"),
          [
            Tree.primitive(message)]))) :
    (
      result === SUCCESS_RESULT ?
      expression :
      Tree.sequence(expression, result))));

const finalize_target = (expression, check, result) => (
  Throw.assert(check, null, "Must check the result"),
  (
    result === TARGET_RESULT ?
    expression :
    Tree.sequence(
      expression,
      (
        result === SUCCESS_RESULT ?
        Tree.primitive(true) :
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

exports.string = (expression) => Tree.apply(
  Tree.__intrinsic__("String"),
  Tree.primitive(void 0),
  [expression]);

exports.fork_nullish = (closure, nullable_expression_1, nullable_expression_2) => Tree.conditional(
  Tree.conditional(
    Tree.binary(
      "===",
      closure(),
      Tree.primitive(null)),
    Tree.primitive(true),
    Tree.binary(
      "===",
      closure(),
      Tree.primitive(void 0))),
  (
    nullable_expression_1 === null ?
    closure() :
    nullable_expression_1),
  (
    nullable_expression_2 === null ?
    Tree.apply(
      Tree.__intrinsic__("Object"),
      Tree.primitive(void 0),
      [closure()]) :
    nullable_expression_2));

exports.convert_to_array = (expression) => Tree.apply(
  Tree.__intrinsic__("Array.from"),
  Tree.primitive(void 0),
  [expression]);

exports.convert_to_object = (expression) => Tree.apply(
  Tree.__intrinsic__("Object"),
  Tree.primitive(void 0),
  [expression]);

// // type Closure1 = () -> Expression
// // type Closure2 = () -> Expression
// // type Closure3 = (Expression) -> Expression
// exports.convert_to_object = (closure1, closure2, closure3) => Tree.conditional(
//   Tree.conditional(
//     Tree.binary(
//       "===",
//       closure1(),
//       Tree.primitive(null)),
//     Tree.primitive(true),
//     Tree.binary(
//       "===",
//       closure1(),
//       Tree.primitive(void 0))),
//   closure2(),
//   closure3(
//     Tree.apply(
//       Tree.__intrinsic__("Object"),
//       Tree.primitive(void 0),
//       [
//         closure1()])));

//////////////////
// Construction //
//////////////////

exports.construct_symbol = (message) => Tree.apply(
  Tree.__intrinsic__("Symbol"),
  Tree.primitive(void 0),
  [
    Tree.primitive(message)]);

exports.construct_object = (prototype, properties) => Tree.object(prototype, properties);

// ArrayLite.every(
//   properties,
//   (property) => (
//     "value" in property[1] &&
//     property[1].writable === true &&
//     property[1].enumerable === true &&
//     property[1].configurable === true)) ?
// Tree.object(
//   prototype,
//   ArrayLite.map(
//     properties,
//     (property) => [
//       property[0],
//       property[1].value])) :
// Tree.apply(
//   Tree.__intrinsic__("Object.create"),
//   Tree.primitive(void 0),
//   [
//     prototype,
//     Tree.object(
//       Tree.primitive(null),
//       ArrayLite.map(
//         properties,
//         (property) => [
//           property[0],
//           make_descriptor(property[1])]))]));

exports.construct_array = (elements) => Tree.apply(
  Tree.__intrinsic__("Array.of"),
  Tree.primitive(void 0),
  elements);

// type Target = Expression
// type Traps = [(String, Expression)]
exports.construct_proxy = (target, traps) => Tree.construct(
  Tree.__intrinsic__("Proxy"),
  [
    target,
    Tree.object(
      Tree.primitive(null),
      ArrayLite.map(
        traps,
        (trap) => [
          Tree.primitive(trap[0]),
          trap[1]]))]);

// type Pattern = String
// type Flags = String
exports.construct_regexp = (pattern, flags) => Tree.construct(
  Tree.__intrinsic__("RegExp"),
  [
    Tree.primitive(pattern),
    Tree.primitive(flags)]);

// type Message = String
exports.throw_syntax_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__intrinsic__("SyntaxError"),
    [
      Tree.primitive(message)]));

// type Message = String
exports.throw_type_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__intrinsic__("TypeError"),
    [
      Tree.primitive(message)]));

// type Message = String
exports.throw_reference_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__intrinsic__("ReferenceError"),
    [
      Tree.primitive(message)]));

/////////////////////////////////////////////////
// (Reflect && Object) >> Without Side Effects //
/////////////////////////////////////////////////

exports.apply = (target, ths, args) => Tree.apply(
  Tree.__intrinsic__("Reflect.apply"),
  Tree.primitive(void 0),
  [target, ths, args]);

// type Newtarget = Maybe tree.Expression
exports.construct = (target, args, newtarget) => Tree.apply(
  Tree.__intrinsic__("Reflect.construct"),
  Tree.primitive(void 0),
  (
    newtarget === null ?
    [target, args] :
    [target, args, newtarget]));

// type Receiver = Maybe tree.Expression
exports.get = (target, key, receiver) => Tree.apply(
  Tree.__intrinsic__("Reflect.get"),
  Tree.primitive(void 0),
  (
    receiver === null ?
    [target, key] :
    [target, key, receiver]));

exports.get_own_property_descriptor = (target, key) => Tree.apply(
  Tree.__intrinsic__("Reflect.getOwnPropertyDescriptor"),
  Tree.primitive(void 0),
  [target, key]);

exports.has = (target, key) => Tree.apply(
  Tree.__intrinsic__("Reflect.has"),
  Tree.primitive(void 0),
  [target, key]);

exports.get_prototype_of = (target) => Tree.apply(
  Tree.__intrinsic__("Reflect.getPrototypeOf"),
  Tree.primitive(void 0),
  [target]);

exports.is_extensible = (target) => Tree.apply(
  Tree.__intrinsic__("Reflect.isExtensible"),
  Tree.primitive(void 0),
  [target]);

exports.own_keys = (target) => Tree.apply(
  Tree.__intrinsic__("Reflect.ownKeys"),
  Tree.primitive(void 0),
  [target]);

exports.keys = (target) => Tree.apply(
  Tree.__intrinsic__("Object.keys"),
  Tree.primitive(void 0),
  [target]);

// type Array = Expression
// type Start = Expression
// type End = Maybe Expression
exports.slice = (array, start, end) => Tree.apply(
  Tree.__intrinsic__("Array.prototype.slice"),
  array,
  (
    end === null ?
    [start] :
    [start, end]));

exports.concat = (arrays) => Tree.apply(
  Tree.__intrinsic__("Array.prototype.concat"),
  Tree.apply(
    Tree.__intrinsic__("Array.of"),
    Tree.primitive(void 0),
    []),
  arrays);

exports.includes = (array, element) => Tree.apply(
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
  Tree.apply(
    Tree.__intrinsic__("Object.preventExtensions"),
    Tree.primitive(void 0),
    [target]) :
  finalize_success(
    Tree.apply(
      Tree.__intrinsic__("Reflect.preventExtensions"),
      Tree.primitive(void 0),
      [target]),
    check,
    result,
    "Cannot prevent object extensions"));

exports.set_prototype_of = (target, prototype, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.apply(
    Tree.__intrinsic__("Object.setPrototypeOf"),
    Tree.primitive(void 0),
    [target, prototype]) :
  finalize_success(
    Tree.apply(
      Tree.__intrinsic__("Reflect.setPrototypeOf"),
      Tree.primitive(void 0),
      [target, prototype]),
    check,
    result,
    "Cannot set object prototype"));

exports.define_property = (target, key, descriptor, check, result) => (
  (
    check &&
    result === TARGET_RESULT) ?
  Tree.apply(
    Tree.__intrinsic__("Object.defineProperty"),
    Tree.primitive(void 0),
    [
      target,
      key,
      make_descriptor(descriptor)]) :
  finalize_success(
    Tree.apply(
      Tree.__intrinsic__("Reflect.defineProperty"),
      Tree.primitive(void 0),
      [
        target,
        key,
        make_descriptor(descriptor)]),
    check,
    result,
    "Cannot define object property"));

exports.set = (target, key, value, receiver, check, result) => finalize_success(
  Tree.apply(
    Tree.__intrinsic__("Reflect.set"),
    Tree.primitive(void 0),
    (
      receiver === null ?
      [target, key, value] :
      [target, key, value, receiver])),
  check,
  result,
  "Cannot set object property");

exports.delete_property = (target, key, check, result) => finalize_success(
  Tree.apply(
    Tree.__intrinsic__("Reflect.deleteProperty"),
    Tree.primitive(void 0),
    [target, key]),
  check,
  result,
  "Cannot delete object property");

exports.freeze = (target, check, result) => finalize_target(
  Tree.apply(
    Tree.__intrinsic__("Object.freeze"),
    Tree.primitive(void 0),
    [target]),
  check,
  result);

exports.assign = (target, sources, check, result) => finalize_target(
  Tree.apply(
    Tree.__intrinsic__("Object.assign"),
    Tree.primitive(void 0),
    ArrayLite.concat([target], sources)),
  check,
  result);

exports.fill = (array, element, start, end, check, result) => finalize_target(
  Tree.apply(
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
    Tree.apply(
      Tree.__intrinsic__("Array.prototype.push"),
      array,
      [element]),
    check,
    result));
