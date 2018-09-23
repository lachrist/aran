
const ArrayLite = require("array-lite");

const modifiers = [
  // Producers //
  "catch",
  "closure",
  "discard",
  "builtin",
  "primitive",
  "read",
  "regexp",
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
  // Combiners //
  "array",
  "object",
  // Slacker //
  "sandbox"
];

const informers = [
  // Producers //
  "arrival",
  "copy",
  // Swappers //
  "swap",
  // Slacker //
  "block",
  "break",
  "drop",
  "end",
  "finally",
  "label",
  "leave",
  "try"
];

const trigger = (name, expressions) => {
  expressions[expressions.length] = ARAN.build.primitive(ARAN.node.AranSerial);
  return ARAN.build.invoke(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive(name),
    expressions);
};

const builtin = (pointcut, string) => (
  pointcut("builtin", ARAN.node) ?
  trigger(
    "builtin",
    [
      ARAN.build.primitive(string),
      ARAN.build.builtin(string)]) :
  ARAN.build.builtin(string));

module.exports = (pointcut) => {

  const traps = {};

  ArrayLite.forEach(
    modifiers,
    (name) => {
      traps[name] = (...expressions) => (
        pointcut(name, expressions) ?
        trigger(name, expressions) :
        expressions[expressions.length-1]);
    });

  ArrayLite.forEach(
    informers,
    (name) => {
      traps[name] = (...expressions) => (
        pointcut(name, ARAN.node) ?
        trigger(name, expressions) :
        ARAN.build.primitive(null));
    });

  traps.unary = (operator, expression) => (
    pointcut(name, ARAN.node) ?
    trigger(
      "unary",
      [
        ARAN.build.primitive(operator),
        expression]) :
    ARAN.build.unary(operator, expression));

  traps.binary = (operator, expression1, expression2) => (
    pointcut(name, ARAN.node) ?
    trigger(
      "binary",
      [
        ARAN.build.primitive(operator),
        expression1,
        expression2]) :
    ARAN.build.binary(operator, expression1, expression2));

  traps.invoke = (expression1, expression2, expressions) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.get(
          ARAN.build.sequence(
            [
              ARAN.build.hoist(
                ARAN.build.Declare(
                  "let",
                  "invoke_this_"+ARAN.node.AranSerial,
                  ARAN.build.primitive(void 0)),
                ARAN.build.write(
                  "invoke_this_"+ARAN.node.AranSerial,
                  expression1)),
              traps.copy(
                ARAN.build.primitive(1)),
              ARAN.build.read("invoke_this_"+ARAN.node.AranSerial)]),
          expression2),
        ARAN.build.sequence(
          [
            traps.swap(
              ARAN.build.primitive(1),
              ARAN.build.primitive(2)),
            ARAN.build.read("invoke_this_"+ARAN.node.AranSerial)]),
        ARAN.build.array(expressions)]) :
    ARAN.build.invoke(expression1, expression2, expressions));

  traps.apply = (expression, expressions) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        expression,
        traps.primitive(void 0),
        ARAN.build.array(expressions)]) :
    ARAN.build.apply(expression, expressions));

  traps.construct = (expression, expressions) => (
    pointcut("construct", ARAN.node) ?
    trigger(
      "construct",
      [
        expression,
        ARAN.build.array(expressions)]) :
    ARAN.build.construct(expression, expressions));

  traps.set = (expression1, expression2, expression3) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        builtin(pointcut, "Reflect.set"),
        ARAN.build.array(
          [
            traps.apply(
              builtin(pointcut, "Object"),
              [
                expression1]),
            expression2,
            expression3])]) :
    ARAN.build.set(expression1, expression2, expression3));

  traps.get = (expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        builtin(pointcut, "Reflect.get"),
        ARAN.build.array([expression1, expression2])]) :
    ARAN.build.get(expression1, expression2));

  traps.delete = (expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        builtin(pointcut, "Reflect.deleteProperty"),
        ARAN.build.array([expression1, expression2])]) :
    ARAN.build.delete(expression1, expression2));

  return traps;

};
