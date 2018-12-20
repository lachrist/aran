
const ArrayLite = require("array-lite");
const Enumeration = require("../enumeration.js");
const Build = require("../build");

const Reflect_apply = Reflect.apply;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const String_prototype_substring = String.prototype.substring;

module.exports = (pointcut) => {

  const trap = {};

  ArrayLite.forEach(Enumeration.TransformerTrap, (name) => {
    trap[name] = function () {
      const node = arguments[arguments.length-1];
      if (!pointcut(name, node))
        return arguments[0];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length-1);
      return Build.trap(name, expressions, node.AranSerial);
    };
  });

  ArrayLite.forEach(Enumeration.InformerTrap, (name) => {
    const char = Reflect_apply(String_prototype_toUpperCase, name[0], []);
    trap[char + Reflect_apply(String_prototype_substring, name, [1])] = function () {
      const node = arguments[arguments.length-1];
      if (!pointcut(name, node))
        return [];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length-1);
      return Build.Expression(Build.trap(name, expressions, node.AranSerial));
    };
  });

  trap.apply = (expression1, expression2, expressions, node) => (
    pointcut("apply", node) ?
    Build.trap(
      "apply",
      [
        expression1,
        expression2,
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          expressions)],
      node.AranSerial) :
    Build.apply(expression1, expression2, expressions));

  trap.construct = (expression, expressions, node) => (
    pointcut("construct", node) ?
    Build.trap(
      "construct",
      [
        expression,
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          expressions)],
      node.AranSerial) :
    Build.construct(expression, expressions));

  return trap;

};
