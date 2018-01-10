
// array = rest(array, iterator)
//
// function rest () {
//   let step = null;
//   while (!(step = arguments[1].next()).done) {
//     arguments[0][arguments[0].length] = step.value;
//   }
//   return arguments[0];
// }

const ArrayLite = require("array-lite");
const Build = require("../build");
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
      Build.primitive("undefined")),
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
  eval: () => Build.read("eval"),
  rest: () => Build.closure(
    false,
    ArrayLite.concat(
      Build.Declare(
        "let",
        "step",
        Build.primitive(void 0)),
      Build.While(
        Build.unary(
          "!",
          Build.get(
            Build.write(
              "step",
              Build.invoke(
                Build.get(
                  Build.read(
                    "arguments"),
                  Build.primitive(1)),
                Build.primitive("next"),
                [])),
            Build.primitive("done"))),
        Build.Statement(
          Build.set(
            Build.get(
              Build.read("arguments"),
              Build.primitive(0)),
            Build.get(
              Build.get(
                Build.read("arguments"),
                Build.primitive(0)),
              Build.primitive("length")),
            Build.get(
              Build.read("step"),
              Build.primitive("value"))))),
      Build.Return(
        Build.get(
          Build.read("arguments"),
          Build.primitive(0)))))};

const save = (key) => Build.If(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Build.read(
        Escape(key))),
    Build.primitive("undefined")),
  Build.Declare(
    "var",
    Escape(key),
    builtins[key]()),
  []);
