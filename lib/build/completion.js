
const ArrayLite = require("array-lite");

module.exports = (format, static) => ({
  PROGRAM: (statements) => format.PROGRAM(
    ArrayLite.concat(
      ARAN.build.Declare(
        "let",
        "completion",
        format.primitive(void 0)),
      statements,
      format.Statement(
        format.read("completion")))),
  completion: (expression) => format.write("completion", expression)
});
