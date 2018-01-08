
const ArrayLite = require("array-lite");
const Build = require("../../build.js");
const Context = require("../context.js");
const Visit = require("../visit");
const Pattern = require("../pattern");

exports.Declaration = (node) => ArrayLite.flaten(
  ArrayLite.map(
    node.declarations,
    (declarator, temporary) => (
      declarator.init ?
      Pattern.Declare(node.kind, declarator.id, declarator.init) :
      (
        temporary = ARAN.cut.Declare(
          node.kind,
          declarator.id.name,
          ARAN.cut.primitive(void 0)),
        (
          node.kind === "var" ?
          (
            ARAN.context.hoisted[ARAN.context.hoisted.length] = temporary,
            []) :
          temporary)))));
