
const ArrayLite = require("array-lite");
const Build = require("../../../build");
const Common = require("./common.js");

const transformerss = {
  var: {
    expression: Build.Statement,
    binding: (identifier, expression) => {
      ARAN.context.hoisted[ARAN.context.hoisted.length] = ARAN.cut.Declare(
        "var",
        identifier,
        ARAN.cut.primitive(void 0));
      return Build.Statement(
        ARAN.cut.write(identifier, expression));
    }},
  let: {
    expression: Build.Statement,
    binding: (identifier, expression) => ARAN.cut.Declare("let", identifier, expression)},
  const: {
    expression: Build.Statement,
    binding: (identifier, expression) => ARAN.cut.Declare("const", identifier, expression)}};

exports.Declare = (kind, pattern, expression) => ArrayLite.flaten(
  Common(
    transformerss[kind],
    [
      [
        pattern,
        expression]]));
