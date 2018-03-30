
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
  const strict = (
    root.body.length &&
    root.body[0].type === "ExpressionStatement" &&
    root.body[0].expression.type === "Literal" &&
    root.body[0].expression.value === "use strict")
  root.AranStrict = (parent && parent.AranStrict) || strict;
  root.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[root.AranSerial] = root;
  ARAN.hoisted = [];
  ARAN.node = root;
  const statements = ARAN.cut.$Program(
    ArrayLite.flaten(
      ArrayLite.reverse(
        [
          ArrayLite.flatenMap(root.body, Visit.Statement),
          (
            root.AranParent ?
            [] :
            ARAN.cut.Declare(
              "const",
              "this",
              ARAN.cut.$load("global"))),
          ArrayLite.flaten(ARAN.hoisted)])));
  ARAN.hoisted = null;
  ARAN.node = null;
  root.AranMaxSerial = ARAN.counter;
  return ARAN.build.PROGRAM(
    strict,
    (
      parent || !ARAN.sandbox ?
      statements :
      (
        root.AranStrict ?
        ARAN.build.With(
          Meta.gproxy(true),
          ARAN.build.Statement(
            ARAN.build.apply(
              ARAN.build.arrow(
                [],
                statements),
              []))) :
        ARAN.build.Statement(
          ARAN.build.apply(
            ARAN.build.arrow(
              [],
              ARAN.build.With(
                Meta.gproxy(false),
                statements)),
            [])))));
};
