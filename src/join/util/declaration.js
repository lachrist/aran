
const ArrayLite = require("array-lite");
const Escape = require("../../escape.js");
const Visit = require("../visit");
const Util = require("./index.js");

exports.Declaration = (node) => ArrayLite.flaten(
  ArrayLite.map(
    node.declarations,
    (declarator, temporary) => (
      declarator.init ?
      Util.Declare(
        node.kind,
        declarator.id,
        (
          declarator.init.AranTerminate ?
          ARAN.build.write(
            Escape("terminate"),
            Aran.cut.$copy(
              0,
              Visit.expression(declarator.init))) :
          Visit.expression(declarator.init))) :
      (
        temporary = ARAN.cut.Declare(
          node.kind,
          declarator.id.name,
          ARAN.cut.primitive(void 0)),
        (
          node.kind === "var" ?
          (
            ARAN.hoisted[ARAN.hoisted.length] = temporary,
            []) :
          temporary)))));
