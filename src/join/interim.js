
const Escape = require("../escape.js");

exports.hoist = (information, expression) => {
  ARAN.hoisted[ARAN.hoisted.length] = ARAN.build.Declare(
    "let",
    Escape(ARAN.parent.AranSerial + "_" + information),
    ARAN.build.primitive(void 0));
  return ARAN.build.write(
    Escape(ARAN.parent.AranSerial + "_" + information),
    expression);
};

exports.read = (information) => ARAN.build.read(
  Escape(ARAN.parent.AranSerial + "_" + information));

exports.write = (information, expression) => ARAN.build.write(
  Escape(ARAN.parent.AranSerial + "_" + information),
  expression);
