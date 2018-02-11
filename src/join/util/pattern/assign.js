
const ArrayLite = require("array-lite");
const Interim = require("../../interim.js");
const Visit = require("../../visit");
const Util = require("../index.js");
const Common = require("./common.js");

const identity = (argument) => argument;

// const transformers: {
//   expression: (expression) => expression,
//   binding: (identifier, expression) => ARAN.cut$drop
// }

exports.assign = (pattern, expression) => (
  pattern.type === "MemberExpression" ?
  ARAN.cut.$drop(
    ARAN.cut.set(
      Visit.expression(pattern.object),
      Util.property(pattern),
      expression)) :
  (
    pattern.type === "Identifier" ?
    ARAN.cut.write(
      pattern.name,
      expression) :
    Common(
      {
        expression: identity,
        binding: ARAN.cut.write },
      pattern,
      expression)));
