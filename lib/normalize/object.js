
const Build = require("./build.js");

// Discussion: we could have a function simply calling Object and another which
// later test whether a value is null or undefined. This could help reduce cache
// usage for properties. However I don't think the increase in complexity 
// justifies the slight reduction in cache usage.

exports.obj = (closure) => Build.conditional(
  Build.conditional(
    Build.binary(
      "===",
      closure(),
      Build.primitive(null)),
    Build.primitive(true),
    Build.binary(
      "===",
      closure(),
      Build.primitive(void 0))),
  Build.throw(
    Build.construct(
      Build.builtin("TypeError"),
      [
        Build.primitive("Cannot convert 'null' or 'undefined' to an object")])),
  Build.apply(
    Build.builtin("Object"),
    Build.primitive(void 0),
    [
      closure()]));

exports.get = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.has = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.has"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.del = (boolean, expression1, expression2, expression3) => (
  (
    (expression) => (
      boolean ?
      Build.conditional(
        expression,
        (
          expression3 === null ?
          Build.primitive(true),
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

exports.set = (boolean, expression1, expression2, expression3, expression4) => (
  (
    (expression) => (
      boolean ?
      Build.conditional(
        (
          expression4 === null ?
          Build.primitive(true),
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
