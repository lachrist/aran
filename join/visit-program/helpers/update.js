
const Build = require("../../build.js");
const Visit = require("../visit");

exports.update = (left, arrow) => left.type === "Identifier" ?
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
        left.property.computed ?
          Visit.expression(left.property) :
          ARAN.cut.primitive(left.name))),
    arrow(
      ARAN.cut.get(
        Build.read(
          Hide("object")),
        Build.read(
          Hide("property")))));
