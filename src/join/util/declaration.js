
const ArrayLite = require("array-lite");
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
          declarator.init.AranLast ?
          Interim.write(
            "last",
            ARAN.cut.$drop0before(
              Aran.cut.$copy0after(
                Visit.expression(declarator.init)))) :
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
