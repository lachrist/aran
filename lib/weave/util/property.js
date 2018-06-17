
const Visit = require("../visit");

exports.property = (node) => (
  node.computed ?
  Visit.expression(node.property) :
  (
    node.property.type === "Identifier" ?
    ARAN.cut.primitive(node.property.name) :
    ARAN.cut.primitive(node.property.value)));
