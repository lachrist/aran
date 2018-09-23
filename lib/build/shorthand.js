
module.exports = (format, static) => ({
  eval: (expression) => format.apply(
    format.read("eval"),
    [
      expression]),
  invoke: (expression1, expression2, expressions) => format.apply(
    format.get(expression1, expression2),
    expressions),
  discard: (identifier) => format.unary(
    "delete",
    format.read(identifier)),
  delete: (expression1, expression2) => format.unary(
    "delete",
    format.get(expression1, expression2))});
