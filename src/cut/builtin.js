
ArrayLite = require("array-lite");
const Escape = require("../escape.js");

exports.load = (strings) => ARAN.build.read(
  Escape(
    ArrayLite.join(strings, "_")));

exports.SaveGlobal = () => ARAN.build.Declare(
  "var",
  Escape("global"),
  ARAN.build.conditional(
    ARAN.build.binary(
      "===",
      ARAN.build.unary(
        "typeof",
        ARAN.build.read("self")),
      ARAN.build.primitive("undefined")),
    ARAN.build.read("global"),
    ARAN.build.read("self")));

exports.Save = (strings) => ARAN.Declare(
  "var",
  Escape(
    ArrayLite.join(strings, "_")),
  ArrayLite.reduce(
    strings,
    (accumulator, string) => (
      accumulator ?
      ARAN.build.get(
        accumulator,
        ARAN.build.primitive(string)) :
      ARAN.build.read(string)),
    null));
