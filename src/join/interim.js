
const Escape = require("../escape.js");

exports.hoist = (information, expression) => {
  ARAN.hoisted[ARAN.hoisted.length] = ARAN.build.Declare(
    "var",
    Escape(ARAN.parent.AranIndex + "_" + information),
    ARAN.build.primitive(void 0));
  return ARAN.build.write(
    Escape(ARAN.parent.AranIndex + "_" + information),
    expression);
};

exports.read = (information) => ARAN.build.read(
  Escape(ARAN.parent.AranIndex + "_" + information));

exports.write = (information, expression) => ARAN.build.write(
  Escape(ARAN.parent.AranIndex + "_" + information),
  expression);

exports.Declare = (information, expression) => ARAN.build.Declare(
  "var",
  Escape(ARAN.parent.AranIndex + "_" + information),
  expression);
