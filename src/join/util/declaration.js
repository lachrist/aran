
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
        Interim.Declare(
          "terminate",
          ARAN.cut.$copy(
              2,
              Visit.expression(declarator.init))),
        Util.Declare(
          node.kind,
          declarator.id,
          Interim.read("terminate")),
        ARAN.build.Statement(
          ARAN.cut.$drop(
            ARAN.build.read(
              Escape("terminate")))),
        ARAN.build.write(
          Escape("terminate"),
          Interim.read("terminate"))) :
      Util.Declare(
        node.kind,
        declarator.id,
        Visit.expression(declarator.init))) :
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
