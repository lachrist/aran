
const ArrayLite = require("array-lite");
const Escape = require("../../escape.js");
const Visit = require("../visit");
const Util = require("./index.js");

exports.Declaration = (node) => ArrayLite.flatenMap(
  node.declarations,
  (declarator, local) => (
    declarator.init ?
    (
      declarator.init.AranTerminate ?
      ArrayLite.concat(
        ARAN.cut.$Drop(ARAN.terminate),
        ARAN.build.write(
          ARAN.terminate,
          ARAN.cut.copy(
            0,
            Visit.expression(declarator.init)))) :
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
