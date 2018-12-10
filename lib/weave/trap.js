
const ArrayLite = require("array-lite");
const Build = require("./build.js");

const Reflect_apply = Reflect.apply;
const String_prototype_toLowerCase = String.prototype.toLowerCase;

const informers = [
  "Arrival",
  "Break",
  "Continue",
  "Debugger",
  "Enter",
  "Leave"
];

const modifiers = [
 "closure",
  "builtin",
  "primitive",
  "read",
  "drop",
  "eval",
  "return",
  "test",
  "error",
  "throw",
  "write",
  "failure",
  "success"
];

module.exports = (pointcut) => {

  const trap = {};

  ///////////////
  // Modifiers //
  ///////////////

  ArrayLite.forEach(transformers, (name) => {
    trap[name] = function () {
      const node = arguments[arguments.length-1];
      if (!pointcut(name, node))
        return arguments[0];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length-1);
      return Build.trap(name, expressions, node.AranSerial);
    };
  });

  ///////////////
  // Informers //
  ///////////////

  ArrayLite.forEach(informers, (name1) => {
    const name2 = Reflect_apply(String_prototype_toLowerCase, name1, []);
    trap[name1] = function () {
      const node = arguments[arguments.length-1];
      if (!pointcut(name2, node))
        return [];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length-1);
      return Build.Expression(Build.trap(name2, expressions, node.AranSerial));
    };
  });

  ///////////////
  // Combiners //
  ///////////////

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

  ////////////
  // Return //
  ////////////

  return trap;

};
