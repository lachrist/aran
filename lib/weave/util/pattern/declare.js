
const ArrayLite = require("array-lite");
const Interim = require("../../interim.js");
const Common = require("./common.js");

const transformerss = {
  var: {
    expression: (expression) => ARAN.build.Statement(expression),
    binding: (identifier, expression) => {
      ARAN.hoisted[ARAN.hoisted.length] = ARAN.cut.Declare(
        "var",
        identifier,
        ARAN.cut.primitive(void 0));
      return ARAN.build.Statement(
        ARAN.cut.write(identifier, expression));
    }},
  let: {
    expression: (expression) => ARAN.build.Statement(expression),
    binding: (identifier, expression) => ARAN.cut.Declare("let", identifier, expression)},
  const: {
    expression: (expression) => ARAN.build.Statement(expression),
    binding: (identifier, expression) => ARAN.cut.Declare("const", identifier, expression)}};

exports.Declare = (kind, pattern, expression) => (
  pattern.type === "Identifier" ?
  transformerss[kind].binding(pattern.name, expression) :
  ArrayLite.concat(
    ARAN.build.Statement(
      Interim.hoist("right", expression)),
    Common(transformerss[kind], pattern, "right")));
