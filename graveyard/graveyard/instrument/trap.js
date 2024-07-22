
const ArrayLite = require("array-lite");
const Enumeration = require("../enumeration.js");
const Build = require("../build");

const Reflect_apply = Reflect.apply;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const String_prototype_substring = String.prototype.substring;

module.exports = (namespace, pointcut, nodes) => {

  const intercept = (name, expressions, serial) => Build.apply(
    Build.apply(
      Build.intrinsic("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.intrinsic("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.intrinsic("global"),
            Build.primitive(namespace)]),
        Build.primitive(name)]),
    Build.apply(
      Build.intrinsic("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.intrinsic("global"),
        Build.primitive(namespace)]),
    ArrayLite.concat(expression, [Build.primitive(serail)]));

  const trap = {};

  ArrayLite.forEach([
    // Producers //
    "enter",
    "closure",
    "intrinsic",
    "primitive",
    "read",
    // Consumer //
    "drop",
    "eval",
    "test",
    "write",
    "return",
    "throw",
  ], (name) => {
    trap[name] = function () {
      const serial = arguments[arguments.length - 1];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      if (pointcut(name, nodes[serial]))
        return intercept(name, expressions, serial);
      return expressions[0]);
    };
  });

  ArrayLite.forEach([
    "leave",
    "continue",
    "break",
    "debugger"
  ], (name) => {
    trap[name] = function () {
      const serial = arguments[arguments.length - 1];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      if (pointcut(name, nodes[serial]))
        return intercept(name, expressions, serial) :
      return Build.primitive(null));
    };
  });

  trap.unary = (operator, expression, serial) => (
    pointcut("unary", nodes[serial]) ?
    intercept(
      "unary",
      [
        Build.primitive(operator),
        expression],
      serial) :
    Build.unary(operator, expression));

  trap.binary = (operator, expression1, expression2, serial) => (
    pointcut("binary", nodes[serial]) ?
    intercept(
      "binary",
      [
        Build.primitive(operator),
        expression1,
        expression2],
      serial) :
    Build.binary(operator, expression1, expression2));

  trap.apply = (expression1, expression2, expressions, serial) => (
    pointcut("apply", nodes[serial]) ?
    intercept(
      "apply",
      [
        expression1,
        expression2,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          expressions)],
      serial) :
    Build.apply(expression1, expression2, expressions));

  trap.construct = (expression, expressions, serial) => (
    pointcut("construct", nodes[serial]) ?
    intercept(
      "construct",
      [
        expression,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          expressions)],
      serial) :
    Build.construct(expression, expressions));

  trap.object = (expression, expressionss, serial) => (
    pointcut("object", nodes[serial]) ?
    intercept(
      "object",
      [
        expression,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            expressionss,
            (expressions) => Build.apply(
              Build.intrinsic("Array.of"),
              Build.primitive(void 0),
              expressions)))],
      serial) :
    Build.object(expression, expressionss));

  return trap;

};
