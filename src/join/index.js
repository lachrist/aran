
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
const Escape = require("../escape.js");
const Visit = require("./visit");
const Last = require("./last.js");

const keys = Object.keys;

module.exports = (node, strict) => {
  Last(node);
  node.AranParent = null;
  node.AranStrict = (
    strict ||
    (
      node.body.length &&
      node.body[0].type === "ExpressionStatement" &&
      node.body[0].expression.type === "Literal" &&
      node.body[0].expression.value === "use strict"));
  node.AranIndex = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[ARAN.counter] = node;
  ARAN.hoisted = [];
  ARAN.parent = node;
  const statements = ArrayLite.flaten(
    node.body.map(Visit.Statement));
  const result = ARAN.cut.PROGRAM(
    node.AranStrict,
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          keys(builtins),
          save)),
      Interim.Declare(
        "last",
        ARAN.cut.primitive(void 0)),
      ArrayLite.flaten(
        ARAN.hoisted),
      statements),
    Interim.read("last"));
  delete ARAN.hoisted;
  delete ARAN.parent;
  node.AranMaxIndex = ARAN.counter;
  return result;
};

const builtins = {
  global: () => ARAN.build.conditional(
    ARAN.build.binary(
      "===",
      ARAN.build.unary(
        "typeof",
        ARAN.build.read("window")),
      ARAN.build.primitive("undefined")),
    ARAN.build.read("global"),
    ARAN.build.read("window")),
  apply: () => ARAN.build.get(
    ARAN.build.read("Reflect"),
    ARAN.build.primitive("apply")),
  defineProperty: () => ARAN.build.get(
    ARAN.build.read("Object"),
    ARAN.build.primitive("defineProperty")),
  getPrototypeOf: () => ARAN.build.get(
    ARAN.build.read("Object"),
    ARAN.build.primitive("getPrototypeOf")),
  keys: () => ARAN.build.get(
    ARAN.build.read("Object"),
    ARAN.build.primitive("keys")),
  iterator: () => ARAN.build.get(
    ARAN.build.read("Symbol"),
    ARAN.build.primitive("iterator")),
  eval: () => ARAN.build.read("eval"),
  rest: () => ARAN.build.closure(
    false,
    ArrayLite.concat(
      ARAN.build.Declare(
        "let",
        "step",
        ARAN.build.primitive(void 0)),
      ARAN.build.While(
        ARAN.build.unary(
          "!",
          ARAN.build.get(
            ARAN.build.write(
              "step",
              ARAN.build.invoke(
                ARAN.build.get(
                  ARAN.build.read(
                    "arguments"),
                  ARAN.build.primitive(1)),
                ARAN.build.primitive("next"),
                [])),
            ARAN.build.primitive("done"))),
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0)),
            ARAN.build.get(
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.primitive(0)),
              ARAN.build.primitive("length")),
            ARAN.build.get(
              ARAN.build.read("step"),
              ARAN.build.primitive("value"))))),
      ARAN.build.Return(
        ARAN.build.get(
          ARAN.build.read("arguments"),
          ARAN.build.primitive(0)))))};

const save = (key) => ARAN.build.If(
  ARAN.build.binary(
    "===",
    ARAN.build.unary(
      "typeof",
      ARAN.build.read(
        Escape(key))),
    ARAN.build.primitive("undefined")),
  ARAN.build.Declare(
    "var",
    Escape(key),
    builtins[key]()),
  []);
