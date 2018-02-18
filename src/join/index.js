
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
const Interim = require("./interim.js");
const Completion = require("./completion.js");

const keys = Object.keys;

module.exports = (node, parent) => {
  Completion(node);
  node.AranParent = parent || null;
  node.AranStrict = (
    (
      parent && parent.AranStrict) ||
    (
      node.body.length > 0 &&
      node.body[0].type === "ExpressionStatement" &&
      node.body[0].expression.type === "Literal" &&
      node.body[0].expression.value === "use strict"));
  node.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[node.AranSerial] = node;
  ARAN.hoisted = [];
  ARAN.parent = node;
  const statements = ArrayLite.flatenMap(
    node.body,
    Visit.Statement);
  const result = ARAN.cut.PROGRAM(
    node.AranStrict,
    ArrayLite.concat(
      save(
        "global",
        ARAN.build.conditional(
          ARAN.build.binary(
            "===",
            ARAN.build.unary(
              "typeof",
              ARAN.build.read("self")),
            ARAN.build.primitive("undefined")),
          ARAN.build.read("global"),
          ARAN.build.read("self"))),
      ArrayLite.flatenMap(
        [
          ["eval"],
          ["TypeError"],
          ["Reflect", "apply"],
          ["Object", "defineProperty"],
          ["Object", "getPrototypeOf"],
          ["Object", "keys"],
          ["Symbol", "iterator"]],
        (strings) => save(
          ArrayLite.join(strings, "_"),
          ArrayLite.reduce(
            strings,
            (accumulator, string) => (
              accumulator ?
              ARAN.build.get(
                accumulator,
                ARAN.build.primitive(string)) :
              ARAN.build.read(string)),
            null))),
      ArrayLite.flaten(ARAN.hoisted),
      statements));
  delete ARAN.hoisted;
  delete ARAN.parent;
  node.AranMaxSerial = ARAN.counter;
  return result;
};

const save = (key, value) => ARAN.build.If(
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
    value),
  []);
