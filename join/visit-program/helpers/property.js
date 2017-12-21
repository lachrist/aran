
const Visit = require("../visit");

exports.property = (computed, property) => (
  computed ?
  Visit.expression(property) :
  (
    property.type === "Identifier" ?
    ARAN.cut.primitive(property.name)
    ARAN.cut.primitive(property.value)));
