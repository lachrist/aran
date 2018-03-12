
const ArrayLite = require("array-lite");
const Builtin = require("./builtin.js");

module.exports = () => ARAN.build.If(
  ARAN.build.binary(
    "===",
    ARAN.build.unary(
      "typeof",
      Builtin.load(["global"])),
    ARAN.build.primitive("undefined")),
  ArrayLite.concat(
    Builtin.SaveGlobal(),
    Builtin.SaveEvalSubstitute(),
    Builtin.SaveEvalAuthentic(),
    ArrayLite.flatenMap(
      [
        ["TypeError"],
        ["ReferenceError"],
        ["Reflect", "apply"],
        ["Object", "defineProperty"],
        ["Object", "getPrototypeOf"],
        ["Object", "keys"],
        ["Symbol", "iterator"]],
      Builtin.Save)),
  []);
