
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");

exports.Declaration = (node) => ArrayLite.flatenMap(
  node.declarations,
  (declarator, local) => (
    declarator.init ?
    Util.Declare(
      node.kind,
      declarator.id,
      Visit.expression(declarator.init)) :
    (
      local = ARAN.cut.Declare(
        node.kind,
        declarator.id.name,
        ARAN.cut.primitive(void 0)),
      (
        node.kind === "var" ?
        (
          ARAN.hoisted[ARAN.hoisted.length] = local,
          []) :
        local))));
