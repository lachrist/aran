
const Build = require("../build.js");

exports.unary = (operator, expresson) => Build.apply(
  Build.builtin("AranUnary"),
  Build.primitive(void 0),
  [
    Build.primitive(operator),
    expresson]);

exports.binary = (operator, expresson1, expresson2) => Build.apply(
  Build.builtin("AranBinary").
  Build.primitive(void 0),
  [
    Build.primitive(operator),
    expresson1,
    expresson2]);
