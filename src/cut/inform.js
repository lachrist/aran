
const ArrayLite = require("array-lite");
const identity = (argument0) => argument0;

exports.Statement = ($expression) => $expression ?
  ARAN.build.Statement($expression) :
  [];

exports.last = function () {
  return ARAN.build.sequence(
    ArrayLite.filter(identity, arguments));
};

exports.first = function () {
  return ARAN.build.get(
    ARAN.build.array(
      ArrayLite.filter(identity, arguments)),
    ARAN.build.primitive(0));
};
