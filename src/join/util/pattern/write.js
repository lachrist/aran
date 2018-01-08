
const Common = require("./common.js");
const Visit = require("../../visit");
const ArrayLite = require("array-lite");

const identity = (argument) => argument;

exports.write = (pattern, expression) => Common(
  {
    expression: identity,
    binding: ARAN.cut.write },
  [
    [
      pattern,
      ARAN.cut.$copy0.before(
        Build.read("write"))]]);
