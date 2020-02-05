
const Build = require("./build.js");

exports.obj = (closure) => Build.conditional(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      closure()),
    Build.primitive("object")),
  closure(),
  Build.conditional(
    Build.binary(
      "===",
      closure(),
      Build.primitive(void 0)),
    Build.primitive(null),
    Build.apply(
      Build.builtin("Object"),
      Build.primitive(void 0),
      [
        closure()])));

exports.get = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.has = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.has"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.del = (tobechecked, expression1, expression2, expression3) => (
  (
    (expression) => (
      tobechecked ?
      Build.conditional(
        expression,
        (
          expression3 === null ?
          Build.primitive(true) :
          expression3),
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Cannot delete object property")]))) :
      (
        expression3 === null ?
        expression :
        Build.sequence(expression, expression3))))
  (
    Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [expression1, expression2])));

exports.set = (tobechecked, expression1, expression2, expression3, expression4) => (
  (
    (expression) => (
      tobechecked ?
      Build.conditional(
        expression,
        (
          expression4 === null ?
          Build.primitive(true) :
          expression4),
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Cannot assign object property")]))) :
      (
        expression4 === null ?
        expression :
        Build.sequence(expression, expression4))))
  (
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [expression1, expression1, expression2])));
