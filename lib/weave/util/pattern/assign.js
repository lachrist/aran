
const ArrayLite = require("array-lite");
const Interim = require("../../interim.js");
const Visit = require("../../visit");
const Util = require("../index.js");
const Common = require("./common.js");

const transformers = {
  expression: (expression) => [expression],
  binding: (identifier, expression) => ARAN.cut.write(identifier, expression)
};

exports.assign = (pattern, expression) => (
  pattern.type === "Identifier" ?
  ARAN.cut.write(
    pattern.name,
    expression) :
  ArrayLite.concat(
    Interim.hoist(
      "right",
      expression),  
    Common(
      transformers,
      pattern,
      expression)));
