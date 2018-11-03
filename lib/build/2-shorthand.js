
const ArrayLite = require("array-lite");

const Object_assign = Object.assign;

module.exports = (input) => Object_assign(
  {
    read: (string) => (
      string === "this" ?
      input.this() :
      (
        string === "new.target" ?
        input.meta("new", "target") :
        input.identifier(string))),
    construct: input.new,
    closure: input.function,
    primitive: (primitive) => {
      if (primitive === void 0)
        return input.unary(
          "void",
          input.literal(0))
      if (primitive !== primitive)
        return input.binary(
          "/",
          input.literal(0),
          input.literal(0));
      if (primitive === 1/0)
        return input.binary(
          "/",
          input.literal(1),
          input.literal(0));
      if (primitive === -1/0)
        return input.binary(
          "/",
          input.unary(
            "-",
            input.literal(1)),
          input.literal(0)):
      return input.literal(primitive); },
    invoke: (expression1, expression2, expressions) => input.call(
      input.get(expression1, expression2),
      expressions),
    apply: (expression, expressions) => input.call(
      input.sequence(
        [
          input.primitive(null)],
        input.expression()),
      expressions),
    eval: (expression) => input.call(
      input.read("eval"),
      [
        expression]),
    discard: (identifier) => input.unary(
      "delete",
      input.read(identifier)),
    delete: (expression1, expression2) => input.unary(
      "delete",
      input.get(expression1, expression2)),
    completion: (expression) => input.write("completion", expression)
    PROGRAM: (statements) => input.PROGRAM(
      ArrayLite.concat(
        input.Declare(
          "let",
          "completion",
          input.unary(
            "void",
            input.literal(0))),
        statements,
        input.Statement(
          input.read("completion"))))},
  input);
