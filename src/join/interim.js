
const Build = require("../build");
const Escape = require("../escape.js");

exports.hoist = (information, expression) => {
  ARAN.context.hoisted[ARAN.context.hoisted.length] = Build.Declare(
    "var",
    Escape(ARAN.index + "_" + information),
    Build.primitive(void 0));
  return Build.write(
    Escape(ARAN.index + "_" + information),
    expression);
};

exports.read = (information) => Build.read(
  Escape(ARAN.index + "_" + information));

exports.write = (information, expression) => Build.write(
  Escape(ARAN.index + "_" + information),
  expression);

exports.Declare = (information, expression) => Build.Declare(
  "var",
  Escape(ARAN.index + "_" + information),
  expression);
