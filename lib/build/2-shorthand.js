
const ArrayLite = require("array-lite");

const Object_assign = Object.assign;

module.exports = (input) => Object_assign(
  {
    literal: (primitive) => {
      if (primitive === void 0)
        return input.unary(
          "void",
          input.jsonliteral(0))
      if (primitive !== primitive)
        return input.binary(
          "/",
          input.jsonliteral(0),
          input.jsonliteral(0));
      if (primitive === 1/0)
        return input.binary(
          "/",
          input.jsonliteral(1),
          input.jsonliteral(0));
      if (primitive === -1/0)
        return input.binary(
          "/",
          input.unary(
            "-",
            input.jsonliteral(1)),
          input.jsonliteral(0)):
      return input.jsonliteral(primitive); },
    eval: (expression) => input.call(
      input.read("eval"),
      [
        expression]),
    discard: (identifier) => input.unary(
      "delete",
      input.read(identifier)),
    completion: (expression) => input.write("completion", expression)
    PROGRAM: (statements) => input.PROGRAM(
      ArrayLite.concat(
        input.Declare(
          "let",
          "completion",
          input.unary(
            "void",
            input.jsonliteral(0))),
        statements,
        input.Statement(
          input.read("completion"))))},
  input);
