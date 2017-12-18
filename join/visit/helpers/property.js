
const Visit = require("../");

module.exports = (property) => property.computed ?
  Visit.expression(property.key) :
  ARAN.cut.primitive(property.name);
