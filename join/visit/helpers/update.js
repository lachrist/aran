
const Build = require("../../build.js");
const Flaten = require("../../flaten.hs");
const Hide = require("../../hide.js");
const Visit = require("../visit");
const Helpers = require("./index.js");

module.exports = (left, arrow) => left.type === "Identifier" ?
  ARAN.cut.write(
    left.name,
    arrow(
      ARAN.cut.read(left.name))) :
  ARAN.cut.set(
    ARAN.cut.copy0.after(
      Build.write(
        Hide("object"),
        Visit.expression(left.object))),
    ARAN.cut.copy2.after(
      Build.write(
        Hide("property"),
        Helpers.property(left.property))),
    arrow(
      ARAN.cut.get(
        Build.read(
          Hide("object")),
        Build.read(
          Hide("property")))));
