
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
  return ARAN.build.call(
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(name)),
    expressions);
};

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

  traps.apply = (expression1, expression2, expressions) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        expression1,
        expression2,
        ARAN.build.array(expressions)]) :
    ARAN.build.apply(expression1, expression2, expressions));

  traps.invoke = (expression1, expression2, expressions) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.get(
          ARAN.build.get(
            ARAN.build.array(
              [
                traps.copy(
                  ARAN.build.primitive(1)),
                ARAN.build.declare(
                  "let",
                  ARAN.unique("cut_traps_invoke_this"),
                  expression1)]),
            ARAN.build.primitive(0)),
          expression2),
        ARAN.build.sequence(
          [
            traps.swap(
              ARAN.build.primitive(1),
              ARAN.build.primitive(2)),
            ARAN.build.read(
              ARAN.unique("cut_traps_invoke_this"))]),
        ARAN.build.array(expressions)]) :
    ARAN.build.invoke(expression1, expression2, expressions));

  traps.construct = (expression, expressions) => (
    pointcut("construct", ARAN.node) ?
    trigger(
      "construct",
      [
        expression,
        ARAN.build.array(expressions)]) :
    ARAN.build.construct(expression, expressions));

  traps.unary = (operator, expression) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.builtin(
          ARAN.build.primitive("Reflect.unary"),
          ARAN.build.builtin("Reflect.unary")),
        traps.primitive(
          ARAN.build.primitive(void 0)),
        ARAN.build.array([
          traps.primitive(
            ARAN.build.primitive(operator)),
          expression])]) :
    ARAN.build.unary(operator, expression));

  traps.binary = (operator, expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.builtin(
          ARAN.build.primitive("Reflect.binary"),
          ARAN.build.builtin("Reflect.binary")),
        traps.primitive(
          ARAN.build.primitive(void 0)),
        ARAN.build.array([
          traps.primitive(
            ARAN.build.primitive(operator)),
          expression1,
          expression2])]) :
    ARAN.build.binary(operator, expression1, expression2));

  traps.get = (expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.builtin(
          ARAN.build.primitive("Reflect.get"),
          ARAN.build.builtin("Reflect.get")),
        traps.primitive(
          ARAN.build.primitive(void 0)),
        ARAN.build.array(
          [
            traps.apply(
              traps.builtin(
                ARAN.build.primitive("Object"),
                ARAN.build.builtin("Object")),
              [
                expression1]),
            expression2])]) :
    ARAN.build.get(expression1, expression2));

  traps.set = (expression1, expression2, expression3) => (
    pointcut("apply", ARAN.node) ?
    trigger(
      "apply",
      [
        traps.builtin(
          ARAN.build.primitive("Reflect.set"),
          ARAN.build.builtin("Reflect.set")),
        traps.primitive(
          ARAN.build.primitive(void 0)),
        ARAN.build.array(
          [
            traps.apply(
              traps.builtin(
                ARAN.build.primitive("Object"),
                ARAN.build.builtin("Object")),
              [
                expression1]),
            expression2,
            expression3])]) :
    ARAN.build.set(expression1, expression2, expression3));

  traps.strict_set = (expression1, expression2, expression3) => ARAN.build.apply(
    ARAN.build.closure(
      ArrayLite.concat(
        ARAN.build.statement(
          traps.copy(
            ARAN.build.primitive(1))),
        ARAN.build.If(
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(0)),
          ARAN.build.Return(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0))),
          ARAN.build.Throw(
            traps.Throw(
              traps.construct(
                traps.builtin(
                  ARAN.build.primitive("TypeError"),
                  ARAN.build.builtin("TypeError")),
                [
                  traps.primitive(
                    ARAN.build.primitive("Cannot assign object property"))])))))),
    [
      traps.apply(
        traps.builtin(
          ARAN.build.primitive("Reflect.set"),
          ARAN.build.builtin("Reflect.set")),
        [expression1, expression2, expression3])]);

  traps.delete = (expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    pointcut
    ARAN.build.delete(expression1, expression2));

  traps.strict_delete = (boolean, expression1, expression2) => (
    pointcut("apply", ARAN.node) ?
    (
      (
        (expression) => (
          boolean ?
          ARAN.build.apply(
            ARAN.build.closure(
              null,
              ArrayLite.concat(
                ARAN.build.statement(
                  traps.copy(
                    ARAN.build.primitive(1))),
                ARAN.build.If(
                  ARAN.build.get(
                    ARAN.build.read("arguments"),
                    ARAN.build.primitive(0)),
                  ARAN.build.Return(
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Throw(
                    traps.Throw(
                      traps.construct(
                        traps.builtin(
                          ARAN.build.primitive("TypeError"),
                          ARAN.build.builtin("TypeError")),
                        [
                          traps.primitive(
                            ARAN.build.primitive("Cannot assign object property"))])))))),
            [expression]) :
          expression))
      trigger(
        "apply",
        [
          traps.builtin(
            ARAN.build.primitive("Reflect.deleteProperty"),
            ARAN.build.builtin("Reflect.deleteProperty")),
          traps.primitive(
            ARAN.build.primitive(void 0)),
          ARAN.build.array(
            [
              traps.apply(
                traps.builtin(
                  ARAN.build.primitive("Object"),
                  ARAN.build.builtin("Object")),
                [
                  expression1]),
              expression2])])) :
    ARAN.build.delete(boolean, expression1, expression2));

  return traps;

};
