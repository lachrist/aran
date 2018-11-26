
const ArrayLite = require("array-lite");
const Array_from = Array.from;

// I tried to make lib/cut context independent.
// ARAN.node.AranSerial is the only place where
// the currently visited node is inspected.

const trigger = (name, expressions) => {
  expressions[expressions.length] = ARAN.build.primitive(ARAN.node.AranSerial);
  return ARAN.build.call(
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(name)),
    expressions);
};

module.exports = (pointcut) => {

  const traps = {};

  // Modifiers //
  ArrayLite.forEach(
    [
      // Producers //
      "error",
      "closure",
      "builtin",
      "primitive",
      "read",
      // 4-Producers //
      "arrival",
      // Consumers //
      "declare",
      "eval",
      "return",
      "test",
      "throw",
      "write"],
    (name) => {
      traps[name] = function () => {
        return (
          pointcut(name, ARAN.node) ?
          trigger(
            name,
            Array_from(arguments)) :
          arguments[arguments.length-1]);
      };
    });

  // Informers //
  ArrayLite.forEach(
    [
      "drop",
      "break",
      "continue",
      "enter",
      "leave"],
    (name) => {
      traps[name] = (...expressions) => (
        pointcut(name, ARAN.node) ?
        trigger(name, expressions) :
        ARAN.build.primitive(null));
    });

  traps.apply = (expression1, expression2, expression3) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        expression1,
        expression2,
        expression3]),
    ARAN.build.apply(expression1, expression3, expression3));

  traps.construct = (expression1, expression2) => (
    pointcut("construct", ARAN.node) ?
    trigger(
      "construct",
      [
        expression1,
        expression2]),
    ARAN.build.construct(expression1, expression2));

  return traps;

};
