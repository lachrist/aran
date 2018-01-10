
const Common = require("./common.js");

const identity = (argument) => argument;

exports.write = (pattern, expression) => ARAN.build.sequence(
  Common(
    {
      expression: identity,
      binding: ARAN.cut.write },
    [
      [
        pattern,
        expression]]));
