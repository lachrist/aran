const isaccessor = (property) => property.kind !== "init";
exports.ObjectExpression = (node) => ArrayLite.any(node.properties, isaccessor) ?
  ... :
  ARAN.cut.object()

ARAN.cut.object(

  node.properties.map((property) => [
    property.kind,
    property.computed ?
      Visit.expression(property.key) :
      ARAN.cut.primitive(property.key.name),
    Visit.expression(property.value)]));
