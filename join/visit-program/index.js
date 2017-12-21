
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Protect = require("../protect.js");
const Cut = require("./cut");
const Visit = require("./visit");

const keys = Object.keys;

module.exports = (node) => {
  node.__min__ = ++ARAN.counter;
  ARAN.index = ARAN.counter;
  ARAN.context = Context(node.body[0]);
  const statements = ArrrayLite.flaten(
    node.body.map(Visit.Statement));
  return Build.PROGRAM(
    ARAN.context.strict,
    ArrrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          keys(bindings),
          save)),
      ArrayLite.flaten(
        ArrayLite.map(
          ARAN.hidden,
          (identifier) => Build.Declare(
            "var",
            identifier,
            Build.primitive(null)))),
      ArrayLite.flaten(
        ARAN.context.hoisted),
      statements));
};

const builtins = {
  global: () => Build.conditional(
    Build.binary(
      Build.unary(
        "typeof",
        Build.read("window")),
      Build.primitive(void 0)),
    Build.read("global"),
    Build.read("window")),
  apply: () => Build.get(
    Build.read("Reflect"),
    "apply"),
  defineProperty: () => Build.get(
    Build.read("Object"),
    "defineProperty"),
  getPrototypeOf: () => Build.get(
    Build.read("Object"),
    "getPrototypeOf"),
  keys: () => Build.get(
    Build.read("Object"),
    "keys"),
  iterator: () => Build.get(
    Build.read("Symbol"),
    "iterator"),
  eval: () => Build.read("eval")};

const save = (key) => Build.If(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Build.read(Protect(key))),
    Build.unary(
      "void",
      Build.primitive(0))),
  Build.Declaration(
    "var",
    Protect(key)
    builtins[key]()),
  []);
