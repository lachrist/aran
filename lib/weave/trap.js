
const ArrayLite = require("array-lite");
const Enumeration = require("../enumeration.js");
const Build = require("../build");

const Reflect_apply = Reflect.apply;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const String_prototype_substring = String.prototype.substring;

module.exports = (pointcut, nodes) => {

  const trap = {};

  ArrayLite.forEach(Enumeration.TransformerTrap, (name) => {
    trap[name] = function () {
      const serial = arguments[arguments.length - 1];
      if (!pointcut(name, nodes[serial]))
        return arguments[0];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      return Build.trap(name, expressions, serial);
    };
  });

  ArrayLite.forEach(Enumeration.InformerTrap, (name) => {
    const char = Reflect_apply(String_prototype_toUpperCase, name[0], []);
    trap[char + Reflect_apply(String_prototype_substring, name, [1])] = function () {
      const serial = arguments[arguments.length - 1];
      if (!pointcut(name, nodes[serial]))
        return [];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      return Build.Expression(Build.trap(name, expressions, serial));
    };
  });

  trap.unary = (operator, expression, serial) => (
    pointcut("unary", nodes[serial]) ?
    Build.trap(
      "unary",
      [
        Build.primitive(operator),
        expression],
      Build.primitive(serial)) :
    Build.unary(operator, expression));

  trap.binary = (operator, expression1, expression2, serial) => (
    pointcut("binary", nodes[serial]) ?
    Build.trap(
      "binary",
      [
        Build.primitive(operator),
        expression1,
        expression2],
      Build.primitive(serial)) :
    Build.unary(operator, expression));

  trap.apply = (expression1, expression2, expressions, serial) => (
    pointcut("apply", nodes[serial]) ?
    Build.trap(
      "apply",
      [
        expression1,
        expression2,
        Build.array(expressions)],
      serial) :
    Build.apply(expression1, expression2, expressions));

  trap.construct = (expression, expressions, serial) => (
    pointcut("construct", nodes[serial]) ?
    Build.trap(
      "construct",
      [
        expression,
        Build.array(expressions)],
      serial) :
    Build.construct(expression, expressions));

  return trap;

};
