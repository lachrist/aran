
const ArrayLite = require("array-lite");

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
      "catch",
      "closure",
      "discard",
      "builtin",
      "primitive",
      "read",
      "arrival",
      // Consumers //
      "completion",
      "declare",
      "eval",
      "failure",
      "return",  
      "success",
      "test",
      "throw",
      "with",
      "write",
      // Others //
      "sandbox"],
    (name) => {
      traps[name] = (...expressions) => (
        pointcut(name, expressions) ?
        trigger(name, expressions) :
        expressions[expressions.length-1]);
    });

  // Informers //
  ArrayLite.forEach(
    [
      // Bystanders //
      "block",
      "break",
      "end",
      "finally",
      "label",
      "leave",
      "try",
      // Others //
      "copy",
      "drop",
      "swap"],
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

  // traps.apply = (expression1, expressions, booleans) => (
  //   pointcut("apply", ARAN.node) ?
  //   trigger(
  //     "apply",
  //     [
  //       expression1,
  //       traps.primitive(
  //         ARAN.build.primitive(void 0)),

  //       ARAN.build.array(
  //         [


  // traps.apply = (expression1, expression2, expressions) => (
  //   pointcut("apply", ARAN.node) ?
  //   trigger(
  //     "apply",
  //     [
  //       expression1,
  //       expression2,
  //       ARAN.build.array(expressions)]) :
  //   ARAN.build.apply(expression1, expression2, expressions));

  // traps.construct = (expression, expressions) => (
  //   pointcut("construct", ARAN.node) ?
  //   trigger(
  //     "construct",
  //     [
  //       expression,
  //       ARAN.build.array(expressions)]) :
  //   ARAN.build.construct(expression, expressions));

  return traps;

};
