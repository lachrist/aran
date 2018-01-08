
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Escape = require("../escape.js");
const Visit = require("./visit");
const Context = require("./context.js");

const keys = Object.keys;

module.exports = (node) => {
  node.__min__ = ++ARAN.counter;
  ARAN.index = ARAN.counter;
  ARAN.context = Context(node.body[0]);
  const statements = ArrayLite.flaten(
    node.body.map(Visit.Statement));
  return Build.PROGRAM(
    ARAN.context.strict,
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          keys(builtins),
          save)),
      ArrayLite.flaten(
        ArrayLite.map(
          ARAN.context.interims,
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
      "===",
      Build.unary(
        "typeof",
        Build.read("window")),
      Build.primitive(void 0)),
    Build.read("global"),
    Build.read("window")),
  apply: () => Build.get(
    Build.read("Reflect"),
    Build.primitive("apply")),
  defineProperty: () => Build.get(
    Build.read("Object"),
    Build.primitive("defineProperty")),
  getPrototypeOf: () => Build.get(
    Build.read("Object"),
    Build.primitive("getPrototypeOf")),
  keys: () => Build.get(
    Build.read("Object"),
    Build.primitive("keys")),
  iterator: () => Build.get(
    Build.read("Symbol"),
    Build.primitive("iterator")),
  eval: () => Build.read("eval")};

const save = (key) => Build.If(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Build.read(
        Escape(key))),
    Build.primitive(void 0)),
  Build.Declare(
    "var",
    Escape(key),
    builtins[key]()),
  []);
