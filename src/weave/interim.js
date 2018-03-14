
exports.hoist = (information, expression) => {
  ARAN.hoisted[ARAN.hoisted.length] = ARAN.build.Declare(
    "let",
    ARAN.namespace +"_" + ARAN.node.AranSerial + "_" + information,
    ARAN.build.primitive(void 0));
  return ARAN.build.write(
    ARAN.namespace +"_" + ARAN.node.AranSerial + "_" + information,
    expression);
};

exports.read = (information) => ARAN.build.read(
  ARAN.namespace + "_" + ARAN.node.AranSerial + "_" + information);

exports.write = (information, expression) => ARAN.build.write(
  ARAN.namespace +"_" + ARAN.node.AranSerial + "_" + information,
  expression);
