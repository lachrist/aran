
const ArrayLite = require("array-lite");
const Build = require("./build.js");

const Reflect_apply = Reflect.apply;
const String_prototype_toLowerCase = String.prototype.toLowerCase;

module.exports = (pointcut) => {

  const trap = {};

  ///////////////
  // Modifiers //
  ///////////////

  ArrayLite.forEach(
    [
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
      "success"],
    (name) => {
      trap[name] = function () {
        return (
          pointcut(name, arguments[arguments.length-1]) ?
          Build.trap(
            name,
            ArrayLite.slice(arguments, 0, arguments.length-1),
            arguments[arguments.length-1].AranSerial) :
          arguments[0]);
      };
    });

  ///////////////
  // Informers //
  ///////////////

  ArrayLite.forEach(
    [
      "Break",
      "Continue",
      "Debugger",
      "Enter",
      "Leave"],
    (name) => {
      trap[name] = function () {
        return (
          pointcut(name, arguments[arguments.length-1]) ?
          Build.Expression(
            Build.trap(
              Reflect_apply(String_prototype_toLowerCase, name, []),
              ArrayLite.slice(arguments, 0, arguments.length-1),
              arguments[arguments.length-1].AranSerial)) :
          []);
      };
    });

  /////////////
  // Special //
  /////////////

  trap.success = (expression, node) => (
    !node.AranParent && pointcut("success", node)  ?
    Build.trap(
      "success",
      [expression],
      node.AranSerial) :
    expression);

  trap.failure = (expression, node) => (
    !node.AranParetn && pointcut("success", node) ?
    Build.trap(
      "failure",
      [expression],
      node.AranSerial) :
    expression);

  ///////////////
  // Combiners //
  ///////////////

  trap.arrival = (expression1, expression2, expression3, expression4, node) => (
      pointcut("arrival", node) ?
      Build.trap(
        "arrival",
        [expression1, expression2, expression3, expression4],
        node.AranSerial) :
      Build.apply(
        Build.builtin("Array.of"),
        Build.primitive(void 0),
        [expression1, expression2, expression3, expression4]));

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
