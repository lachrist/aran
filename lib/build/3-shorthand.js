
module.exports = (format) => ({
  primitive: (primitive) => (
    primitive === void 0 ?
    format.unary(
      "void",
      format.json_primitive(0)) :
    format.json_primitive(primitive)),
  eval: (expression) => format.apply(
    format.read("eval"),
    [
      expression]),
  invoke: (expression1, expression2, expressions) => format.apply(
    format.get(expression1, expression2),
    expressions),
  discard: (identifier) => format.unary(
    "delete",
    format.read(identifier))
});
