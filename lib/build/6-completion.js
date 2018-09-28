
const ArrayLite = require("array-lite");

const Object.assign = Object.assign;

module.exports = (format) => Object_assign(
  {
    PROGRAM: (statements) => format.PROGRAM(
      ArrayLite.concat(
        format.Declare(
          "let",
          "completion",
          format.primitive(void 0)),
        statements,
        format.Statement(
          format.read("completion")))),
    completion: (expression) => format.write("completion", expression)},
  format);
