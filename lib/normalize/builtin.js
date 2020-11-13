"use strict";

const global_Error = global.Error;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

let Tree = require("./tree.js");
const ArrayLite = require("array-lite");

const abort = (message) => { throw new global_Error(message) };

const make_descriptor = (object) => Tree.object(
  Tree.primitive(null),
  ArrayLite.map(
    global_Reflect_ownKeys(object),
    (key) => (
      typeof key === "symbol" ?
      abort("Invalid symbol property for descriptor") :
      [
        Tree.primitive(key),
        (
          typeof object[key] === "boolean" ?
          Tree.primitive(object[key]) :
          object[key])])));

const TARGET_RESULT = {__proto__:null};

const SUCCESS_RESULT = {__proto__:null};

const finalize_success = (expression, check, result, message) => (
  result === TARGET_RESULT ?
  abort("Cannot return the target") :
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
          Tree.__builtin__("TypeError"),
          [
            Tree.primitive(message)]))) :
    (
      result === SUCCESS_RESULT ?
      expression :
      Tree.sequence(expression, result))));

const finalize_target = (expression, check, result) => (
  check ?
  (
    result === TARGET_RESULT ?
    expression :
    Tree.sequence(
      expression,
      (
        result === SUCCESS_RESULT ?
        Tree.primitive(true) :
        result))) :
  abort("Must check the result"));

exports._target_result = TARGET_RESULT;

exports._success_result = SUCCESS_RESULT;

const grabbable = [
  "#globalObjectRecord",
  "#globalDeclarativeRecord",
  "#globalDeclarativeRecordDeadzone",
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap :(
  "eval",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Function.prototype.arguments.__get__",
  "Function.prototype.arguments.__set__",
  "Array.prototype.values",
  "Object.prototype"
];

//////////////
// Gettable //
//////////////

exports.grab = (name) => (
  ArrayLite.includes(grabbable, name) ?
  Tree.__builtin__(name) :
  abort("Cannot grab builtin"));

////////////////
// Convertion //
////////////////

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
      Tree.__builtin__("Object"),
      Tree.primitive(void 0),
      [closure()]) :
    nullable_expression_2));

exports.convert_to_array = (expression) => Tree.apply(
  Tree.__builtin__("Array.from"),
  Tree.primitive(void 0),
  [expression]);

exports.convert_to_object = (expression) => Tree.apply(
  Tree.__builtin__("Object"),
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
//       Tree.__builtin__("Object"),
//       Tree.primitive(void 0),
//       [
//         closure1()])));

//////////////////
// Construction //
//////////////////

exports.construct_object = (prototype, properties) => (
  ArrayLite.every(
    properties,
    (property) => (
      "value" in property[1] &&
      property[1].writable === true &&
      property[1].enumerable === true &&
      property[1].configurable === true)) ?
  Tree.object(
    prototype,
    ArrayLite.map(
      properties,
      (property) => [
        property[0],
        property[1].value])) :
  Tree.apply(
    Tree.__builtin__("Object.create"),
    Tree.primitive(void 0),
    [
      prototype,
      Tree.object(
        Tree.primitive(null),
        ArrayLite.map(
          properties,
          (property) => [
            property[0],
            make_descriptor(property[1])]))]));

exports.construct_array = (elements) => Tree.apply(
  Tree.__builtin__("Array.of"),
  Tree.primitive(void 0),
  elements);

exports.construct_empty_array = (length) => Tree.apply(
  Tree.__builtin__("Array"),
  Tree.primitive(void 0),
  [
    Tree.primitive(length)]);

// type Target = Expression
// type Traps = [(String, Expression)]
exports.construct_proxy = (target, traps) => Tree.construct(
  Tree.__builtin__("Proxy"),
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
  Tree.__builtin__("RegExp"),
  [
    Tree.primitive(pattern),
    Tree.primitive(flags)]);

// type Message = String
exports.throw_syntax_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__builtin__("SyntaxError"),
    [
      Tree.primitive(message)]));

// type Message = String
exports.throw_type_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__builtin__("TypeError"),
    [
      Tree.primitive(message)]));

// type Message = String
exports.throw_reference_error = (message) => Tree.throw(
  Tree.construct(
    Tree.__builtin__("ReferenceError"),
    [
      Tree.primitive(message)]));

/////////////////////////////////////////////////
// (Reflect && Object) >> Without Side Effects //
/////////////////////////////////////////////////

exports.apply = (target, ths, args) => Tree.apply(
  Tree.__builtin__("Reflect.apply"),
  Tree.primitive(void 0),
  [target, ths, args]);

// type Newtarget = Maybe tree.Expression
exports.construct = (target, args, newtarget) => Tree.apply(
  Tree.__builtin__("Reflect.construct"),
  Tree.primitive(void 0),
  (
    newtarget === null ?
    [target, args] :
    [target, args, newtarget]));

// type Receiver = Maybe tree.Expression
exports.get = (target, key, receiver) => Tree.apply(
  Tree.__builtin__("Reflect.get"),
  Tree.primitive(void 0),
  (
    receiver === null ?
    [target, key] :
    [target, key, receiver]));

exports.get_own_property_descriptor = (target, key) => Tree.apply(
  Tree.__builtin__("Reflect.getOwnPropertyDescriptor"),
  Tree.primitive(void 0),
  [target, key]);

exports.has = (target, key) => Tree.apply(
  Tree.__builtin__("Reflect.has"),
  Tree.primitive(void 0),
  [target, key]);

exports.get_prototype_of = (target) => Tree.apply(
  Tree.__builtin__("Reflect.getPrototypeOf"),
  Tree.primitive(void 0),
  [target]);

exports.is_extensible = (target) => Tree.apply(
  Tree.__builtin__("Reflect.isExtensible"),
  Tree.primitive(void 0),
  [target]);

exports.own_keys = (target) => Tree.apply(
  Tree.__builtin__("Reflect.ownKeys"),
  Tree.primitive(void 0),
  [target]);

exports.keys = (target) => Tree.apply(
  Tree.__builtin__("Object.keys"),
  Tree.primitive(void 0),
  [target]);

// type Array = Expression
// type Start = Expression
// type End = Maybe Expression
exports.slice = (array, start, end) => Tree.apply(
  Tree.__builtin__("Array.prototype.slice"),
  array,
  (
    end === null ?
    [start] :
    [start, end]));

exports.concat = (arrays) => Tree.apply(
  Tree.__builtin__("Array.prototype.concat"),
  Tree.apply(
    Tree.__builtin__("Array.of"),
    Tree.primitive(void 0),
    []),
  arrays);

exports.includes = (array, element) => Tree.apply(
  Tree.__builtin__("Array.prototype.includes"),
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
    Tree.__builtin__("Object.preventExtensions"),
    Tree.primitive(void 0),
    [target]) :
  finalize_success(
    Tree.apply(
      Tree.__builtin__("Reflect.preventExtensions"),
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
    Tree.__builtin__("Object.setPrototypeOf"),
    Tree.primitive(void 0),
    [target, prototype]) :
  finalize_success(
    Tree.apply(
      Tree.__builtin__("Reflect.setPrototypeOf"),
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
    Tree.__builtin__("Object.defineProperty"),
    Tree.primitive(void 0),
    [
      target,
      key,
      make_descriptor(descriptor)]) :
  finalize_success(
    Tree.apply(
      Tree.__builtin__("Reflect.defineProperty"),
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
    Tree.__builtin__("Reflect.set"),
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
    Tree.__builtin__("Reflect.deleteProperty"),
    Tree.primitive(void 0),
    [target, key]),
  check,
  result,
  "Cannot delete object property");

exports.freeze = (target, check, result) => finalize_target(
  Tree.apply(
    Tree.__builtin__("Object.freeze"),
    Tree.primitive(void 0),
    [target]),
  check,
  result);

exports.assign = (target, sources, check, result) => finalize_target(
  Tree.apply(
    Tree.__builtin__("Object.assign"),
    Tree.primitive(void 0),
    ArrayLite.concat([target], sources)),
  check,
  result);

exports.fill = (array, element, start, end, check, result) => finalize_target(
  Tree.apply(
    Tree.__builtin__("Array.prototype.fill"),
    array,
    (
      start === null ?
      (
        end !== null ?
        abort("Array.prototype.fill: start cannot be null while end is not null") :
        [element]) :
      (
        end === null ?
        [element, start] :
        [element, start, end]))),
  check,
  result);

exports.push = (array, element, check, result) => (
  result === TARGET_RESULT ?
  abort("push cannot return the target") :
  finalize_target(
    Tree.apply(
      Tree.__builtin__("Array.prototype.push"),
      array,
      [element]),
    check,
    result));
