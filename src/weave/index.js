
const ArrayLite = require("array-lite");
const Meta = require("../meta.js");
const Visit = require("./visit");
const Interim = require("./interim.js");
const Completion = require("./completion.js");

const keys = Object.keys;

module.exports = (root, scope) => {
  Completion(root);
  root.AranScope = scope;
  const strict = (
    root.body.length &&
    root.body[0].type === "ExpressionStatement" &&
    root.body[0].expression.type === "Literal" &&
    root.body[0].expression.value === "use strict");
  root.AranStrict = strict || scope.AranStrict;
  root.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[root.AranSerial] = root;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.flatenMap(root.body, Visit.Statement);
  const statements2 = ArrayLite.flaten(ARAN.hoisted);
  ARAN.hoisted = null;
  root.AranSerialMax = ARAN.counter;
  return ARAN.cut.PROGRAM(
    strict,
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.cut.$completion(
          ARAN.cut.primitive(void 0))),
      statements2,
      statements1));
};
