

const ArrayLite = require("array-lite");
const Build = require("../../build.js"); 
const Visit = require("../visit");

exports.update = (left, update) => (
  left.type === "Identifier" ?
  ARAN.cut.write(
    left.name,
    update(
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
    update(
      ARAN.cut.get(
        Build.read(
          Hide("object")),
        Build.read(
          Hide("property"))))));
