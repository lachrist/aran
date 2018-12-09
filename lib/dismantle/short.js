
const ArrayLite = require("array-lite");
const Build = require("./build.js");

exports.apply = (expression1, expression2, expression3) => Build.apply(
  Build.builtin("Reflect.apply"),
  Build.primitive(void 0),
  [expression1, expression2, expression3]);

exports.construct = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.construct"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.regexp = (string1, string2) => Build.construct(
  Build.builtin("RegExp"),
  [
    Build.primitive(string1),
    Build.primitive(string2)]);

exports.keys = (expression) => Build.apply(
  Build.builtin("AranKeys"),
  Build.primitive(void 0),
  [expression]);

exports.define = (expression1, expression2, expression3) => Build.apply(
  Build.builtin("Object.defineProperty"),
  Build.primitive(void 0),
  [expression1, expression2, expression3]);

exports.hold = (expression1, expression2) => Build.apply(
  Build.builtin("AranHold"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.has = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.has"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.get = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("AranObjectify"),
      Build.primitive(void 0),
      [expression1]),
    expression2]);

exports.delete = (strict, expression1, expression2) => (
  strict ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.builtin("AranObjectify"),
          Build.primitive(void 0),
          [expression1]),
        expression2]),
    Build.primitive(true),
    Build.apply(
      Build.builtin("AranThrowTypeError"),
      Build.primitive(void 0),
      [
        Build.primitive("Cannot delete object property")])) :
  Build.apply(
    Build.builtin("Reflect.deleteProperty"),
    Build.primitive(void 0),
    [
      Build.apply(
        Build.builtin("AranObjectify"),
        Build.primitive(void 0),
        [expression1]),
      expression2]));

exports.type_error = (string) => Build.construct(
  Build.builtin("TypeError"),
  [
    Build.primitive(string)]);

exports.reference_error = (string) => Build.construct(
  Build.builtin("TypeError"),
  [
    Build.primitive(string)]);

exports.throw_type_error = (string) => Build.apply(
  Build.builtin("AranThrowTypeError"),
  Build.primitive(void 0),
  [
    Build.primitive(string)]);

exports.throw_reference_error = (string) => Build.apply(
  Build.builtin("AranThrowReferenceError"),
  Build.primitive(void 0),
  [
    Build.primitive(string)]);

exports.set = (strict, expression1, expression2, expression3) => (
  strict ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),    
      [expression1, expression2, expression3]),
    Build.primitive(void 0),
    Build.apply(
      Build.builtin("AranThrowTypeError"),
      Build.primitive(void 0),
      [
        Build.primitive("Cannot assign object property")])) :
  Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [
      Build.apply(
        Build.builtin("AranObjectify"),
        Build.primitive(void 0),
        [expression1]),
      expression2,
      expression3]));

exports.unary = (operator, expresson) => Build.apply(
  Build.builtin("AranUnary"),
  Build.primitive(void 0),
  [
    Build.primitive(operator),
    expresson]);

exports.binary = (operator, expresson1, expresson2) => Build.apply(
  Build.builtin("AranBinary"),
  Build.primitive(void 0),
  [
    Build.primitive(operator),
    expresson1,
    expresson2]);

exports.array = (expressions) => Build.apply(
  Build.builtin("Array.of"),
  Build.primitive(void 0),
  expressions);

exports.convert = (expression)=> Build.apply(
  Build.builtin("AranObjectify"),
  Build.primitive(void 0),
  [expression]);

exports.initialize = (properties) => Build.apply(
  Build.builtin("AranInitializeObject"),
  Build.primitive(void 0),
  ArrayLite.flatMap(
    properties,
    (property) => [
      Build.primitive(property[0]),
      property[1],
      property[2]]));

exports.concat = (expressions) => Build.apply(
  Build.builtin("Array.prototype.concat"),
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    []),
  expressions);

exports.rest = (expression) => Build.apply(
  Build.builtin("AranRest"),
  Build.primitive(void 0),
  [expression]);
