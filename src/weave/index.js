
const ArrayLite = require("array-lite");
const Meta = require("../meta.js");
const Visit = require("./visit");
const Interim = require("./interim.js");
const Completion = require("./completion.js");

const keys = Object.keys;

module.exports = (root, parent) => {
  Completion(root);
  root.AranParent = parent;
  root.AranParentSerial = parent ? parent.AranSerial : null;
  root.AranStrict = (
    (
      parent && parent.AranStrict) ||
    (
      root.body.length > 0 &&
      root.body[0].type === "ExpressionStatement" &&
      root.body[0].expression.type === "Literal" &&
      root.body[0].expression.value === "use strict"));
  root.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[root.AranSerial] = root;
  ARAN.hoisted = [];
  ARAN.node = root;
  const statements = ArrayLite.flatenMap(
    root.body,
    Visit.Statement);
  const result = ARAN.cut.PROGRAM(
    root.AranStrict,
    (
      ARAN.sandbox && !parent ?
      Meta.gproxy() :
      null),
    ArrayLite.concat(
      ArrayLite.flaten(ARAN.hoisted),
      statements));
  ARAN.hoisted = null;
  ARAN.node = null;
  root.AranMaxSerial = ARAN.counter;
  return result;
};
