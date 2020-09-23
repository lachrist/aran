"use strict";

const Tree = require("./tree.js");
const ArrayLite = require("array-lite");

const global_Error = global.Error;

// type Closure = () -> tree.Expression
exports.convert = (closure) => Tree.conditional(
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
  closure(),
  Tree.apply(
    Tree.builtin("Object"),
    Tree.primitive(void 0),
    [
      closure()]));

const description = (descriptor) => (key) => (
  (
    key === "value" ||
    key === "get" ||
    key === "set") ?
  (
    key in descriptor ?
    [
      [
        Tree.primitive(key),
        descriptor[key]]] :
    []) :
  (
    (
      key in descriptor &&
      descriptor[key] !== false) ?
    [
      [
        Tree.primitive(key),
        (
          descriptor[key] === true ?
          Tree.primitive(true) :
          descriptor[key])]] :
    []));

exports.create = (prototype, properties) => (
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
    Tree.builtin("Object.create"),
    Tree.primitive(void 0),
    [
      prototype,
      Tree.object(
        Tree.primitive(null),
        ArrayLite.map(
          properties,
          (property) => [
            property[0],
            Tree.object(
              Tree.primitive(null),
              ArrayLite.flatMap(
                ["value", "writable", "get", "set", "enumerable", "configurable"],
                description(property[1])))]))]));

/////////////
// Readers //
/////////////

exports.apply = (target, ths, args) => Tree.apply(
  Tree.builtin("Reflect.apply"),
  Tree.primitive(void 0),
  [target, ths, args]);

// type Newtarget = Maybe tree.Expression
exports.construct = (target, args, newtarget) => Tree.apply(
  Tree.builtin("Reflect.construct"),
  Tree.primitive(void 0),
  (
    newtarget === null ?
    [target, args] :
    [target, args, newtarget]));

// type Receiver = Maybe tree.Expression
exports.get = (target, key, receiver) => Tree.apply(
  Tree.builtin("Reflect.get"),
  Tree.primitive(void 0),
  (
    receiver === null ?
    [target, key] :
    [target, key, receiver]));

exports.getOwnPropertyDescriptor = (target, key) => Tree.apply(
  Tree.builtin("Reflect.getOwnPropertyDescriptor"),
  Tree.primitive(void 0),
  [target, key]);

exports.has = (target, key) => Tree.apply(
  Tree.builtin("Reflect.has"),
  Tree.primitive(void 0),
  [target, key]);

exports.getPrototypeOf = (target) => Tree.apply(
  Tree.builtin("Reflect.getPrototypeOf"),
  Tree.primitive(void 0),
  [target]);

exports.isExtensible = (target) => Tree.apply(
  Tree.builtin("Reflect.isExtensible"),
  Tree.primitive(void 0),
  [target]);

exports.ownKeys = (target) => Tree.apply(
  Tree.builtin("Reflect.ownKeys"),
  Tree.primitive(void 0),
  [target]);

/////////////
// Writers //
/////////////

const finalize = (expression, result, message) => (
  result === null ?
  (
    (
      () => { throw new global_Error("Cannot return the target") })
    ()) :
  (
    result === false ?
    expression :
    Tree.conditional(
      expression,
      (
        result === true ?
        Tree.primitive(true) :
        result),
      Tree.throw(
        Tree.construct(
          Tree.builtin("TypeError"),
          [
            Tree.primitive(message)])))));

exports.preventExtensions = (target, result) => (
  result === null ?
  Tree.apply(
    Tree.builtin("Object.preventExtensions"),
    Tree.primitive(void 0),
    [target]) :
  finalize(
    Tree.apply(
      Tree.builtin("Reflect.preventExtensions"),
      Tree.primitive(void 0),
      [target]),
    result,
    "Cannot prevent object extensions"));

exports.setPrototypeOf = (target, prototype, result) => (
  result === null ?
  Tree.apply(
    Tree.builtin("Object.setPrototypeOf"),
    Tree.primitive(void 0),
    [target, prototype]) :
  finalize(
    Tree.apply(
      Tree.builtin("Reflect.setPrototypeOf"),
      Tree.primitive(void 0),
      [target, prototype]),
    result,
    "Cannot set object prototype"));

exports.defineProperty = (target, key, descriptor, result, _descriptor) => (
  _descriptor = Tree.object(
    Tree.primitive(null),
    ArrayLite.flatMap(
      ["value", "writable", "get", "set", "enumerable", "configurable"],
      description(descriptor))),
  (
    result === null ?
    Tree.apply(
      Tree.builtin("Object.defineProperty"),
      Tree.primitive(void 0),
      [target, key, _descriptor]) :
    finalize(
      Tree.apply(
        Tree.builtin("Reflect.defineProperty"),
        Tree.primitive(void 0),
        [target, key, _descriptor]),
      result,
      "Cannot define object property")));

exports.set = (target, key, value, receiver, result) => finalize(
  Tree.apply(
    Tree.builtin("Reflect.set"),
    Tree.primitive(void 0),
    (
      receiver === null ?
      [target, key, value] :
      [target, key, value, receiver])),
  result,
  "Cannot set object property");

exports.deleteProperty = (target, key, result) => finalize(
  Tree.apply(
    Tree.builtin("Reflect.deleteProperty"),
    Tree.primitive(void 0),
    [target, key]),
  result,
  "Cannot delete object property");


// exports.defineDataProperty = (target, key, value, writable, enumerable, configurable, result, check, _descriptor) => (
//   _descriptor = Tree.object(
//       Tree.primitive(null),
//       ArrayLite.concat(
//         [
//           [
//             Tree.primitive("value"),
//             value]],
//         description("writable", writable),
//         description("enumerable", enumerable),
//         description("configurable", configurable))),
//   (
//     (
//       result === null &&
//       !check) ?
//     Tree.apply(
//       Tree.builtin("Object.defineProperty"),
//       Tree.primitive(void 0),
//       [target, key, _descriptor]) :
//     finalize(
//       Tree.apply(
//         Tree.builtin("Reflect.defineProperty"),
//         Tree.primitive(void 0),
//         [target, key, _descriptor]),
//       result,
//       (
//         check ?
//         "Cannot define object data property" :
//         null))));
//
// // type Target = tree.Expression
// // type Key = tree.Expression
// // type Getter = Maybe tree.Expression
// // type Setter = Maybe tree.Expression
// // type Enumerable = Either Boolean Expression
// // type Configurable = Either Boolean Expression
// // type Check = Boolean
// // type Result = Either tree.Expression (Either TargetResult SuccessResult)
// // type TargetResult = ()
// // type SuccessResult = ()
// // type Descriptor = tree.Expression
// exports.defineAccessorProperty = (target, key, getter, setter, enumerable, configurable, result, check, _descriptor) => (
//   getter === null && setter === null ?
//   (
//     (
//       () => { throw new global_Error("The getter and the setter cannot be both null") })
//     ()) :
//   (
//     _descriptor = Tree.object(
//       Tree.primitive(null),
//       ArrayLite.concat(
//         (
//           getter === null ?
//           [] :
//           [
//             [
//               Tree.primitive("get"),
//               getter]]),
//         (
//           setter === null ?
//           [] :
//           [
//             [
//               Tree.primitive("set"),
//               setter]]),
//         description("enumerable", enumerable),
//         description("configurable", configurable))),
//     (
//       (
//         result === null &&
//         !check) ?
//       Tree.apply(
//         Tree.builtin("Object.defineProperty"),
//         Tree.primitive(void 0),
//         [target, key, _descriptor]) :
//       finalize(
//         Tree.apply(
//           Tree.builtin("Reflect.defineProperty"),
//           Tree.primitive(void 0),
//           [target, key, _descriptor]),
//         result,
//         (
//           check ?
//           "Cannot define object accessor property" :
//           null)))));
//
// exports.deleteProperty = (target, key, result, check) => finalize(
//   Tree.apply(
//     Tree.builtin("Reflect.deleteProperty"),
//     Tree.primitive(void 0),
//     [target, key]),
//   result,
//   (
//     check ?
//     "Cannot delete object property" :
//     null));
//
// // type Receiver = Maybe tree.Expression
// exports.set = (target, key, value, receiver, result, check) => finalize(
//   Tree.apply(
//     Tree.builtin("Reflect.set"),
//     Tree.primitive(void 0),
//     (
//       receiver === null ?
//       [target, key, value] :
//       [target, key, value, receiver])),
//   result,
//   (
//     check ?
//     "Cannot assign object property" :
//     null));
