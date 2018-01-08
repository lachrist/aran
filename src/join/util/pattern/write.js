
const Build = require("../../../build");
const Common = require("./common.js");

const identity = (argument) => argument;

exports.write = (pattern, expression) => Build.sequence(
  Common(
    {
      expression: identity,
      binding: ARAN.cut.write },
    [
      [
        pattern,
        expression]]));
