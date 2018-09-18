
const ArrayLite = require("array-lite");

module.exports = (format, static) => ({
  Setup: () => ArrayLite.concat(
    format.Statement(
      static.save(
        "StrictSetCheck",
        format.closure(
          format.If(
            format.get(
              format.read("arguments"),
              format.primitive(0)),
            [],
            format.Throw(
              format.construct(
                static.load("TypeError"),
                [
                  format.primitive("cannot assign object property")])))))),
    format.Statement(
      static.save(
        "StrictStack",
        format.array([]))),
    format.Statement(
      static.save(
        "StrictLengthStack",
        format.array([])))),
  set: (boolean, expression1, expression2, expression3) => (
    boolean ?
    format.apply(
      static.load("StrictSetCheck"),
      [
        format.apply(
          static.load("Reflect.set"),
          [
            expression1,
            expression2,
            expression3])]) :
    format.set(expression1, expression2, expression3));
  set: (expression1, expression2, expression3) => format.apply(
    static.load("Reflect.set"),
    [
      expression1,
      expression2,
      expression3]),
  Return: (expression) => ArrayLite.concat(
    format.Statement(
      format.set(
        static.load("StrictStack"),
        format.primitive("length"),
        format.binary(
          "-",
          format.get(
            static.load("StrictStack"),
            format.primitive("length")),
          format.primitive(1)))),
    format.Return(expression)),
  // function callee () {
  //   META._StrictStack[META.StrictStack.length] = STRICT;
  //   STATEMENTS;
  // }
  closure: (statements) => format.closure(
    ArrayLite.concat(
      format.Statement(
        format.set(
          static.load("StrictStack"),
          format.get(
            static.load("StrictStack"),
            format.primitive("length")),
          format.primitive(ARAN.node.AranStrict))),
      statements)),
  // try {
  //   META._StrictLengthStack[META._StrictLengthStack.length] = META._StrictStack.length;
  //   STATEMENTS1
  // } catch (error) {
  //   META._StrictStack.length = META._StrictLengthStack[META._StrictLengthStack.length-1];
  //   STATEMENTS2;
  // } finally {
  //   META._StrictLengthStack.length = META._StrictLengthStack.length - 1;
  //   STATEMENTS3;
  // }
  Try: (statements1, statements2, statements3) => format.Try(
      ArrayLite.concat(
        format.Statement(
          format.set(
            static.load("StrictLengthStack"),
            format.get(
              static.load("StrictLengthStack"),
              format.primitive("length")),
            format.get(
              static.load("StrictStack"),
              format.primitive("length")))),
        statements1),
      ArrayLite.concat(
        format.Statement(
          format.set(
            static.load("StrictStack"),
            format.primitive("length"),
            format.get(
              static.load("StrictLengthStack"),
              format.binary(
                "-",
                format.get(
                  static.load("StrictLengthStack"),
                  format.primitive("length")),
                format.primitive(1))))),
        statements2),
      ArrayLite.concat(
        format.Statement(
          format.set(
            static.load("StrictStack"),
            format.primitive("length"),
            format.binary(
              "-",
              format.get(
                static.load("StrictLengthStack"),
                format.primitive("length")),
              format.primitive(1)))),
        statements3))});
