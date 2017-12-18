
const Expression = require("./expression.js");
const Statement = require("./statement.js");

const visit = (visitors) => (node) => {
  ast.__min__ = ++ARAN.counter;
  const temporary = ARAN.index;
  ARAN.index = ARAN.counter;
  const result = visitors[node.type](node);
  ARAN.index = temporary;
  ast.__max__ = ARAN.counter;
  return result;
};

exports.Statement = visit(Statement);
exports.expression = Visit(Expression);
