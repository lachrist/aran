
const Escape = require("../escape.js");

exports.hoist = (information, expression) => {
  ARAN.context.hoisted[ARAN.context.hoisted.length] = ARAN.build.Declare(
    "var",
    Escape(ARAN.index + "_" + information),
    ARAN.build.primitive(void 0));
  return ARAN.build.write(
    Escape(ARAN.index + "_" + information),
    expression);
};

exports.read = (information) => ARAN.build.read(
  Escape(ARAN.index + "_" + information));

exports.write = (information, expression) => ARAN.build.write(
  Escape(ARAN.index + "_" + information),
  expression);

exports.Declare = (information, expression) => ARAN.build.Declare(
  "var",
  Escape(ARAN.index + "_" + information),
  expression);
