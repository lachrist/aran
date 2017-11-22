
const Expression = require("./visitors-expression.js");
const Statement = require("./visitors-statement.js");
const Program = require("./visitors-program.js");

const visit = (visitors) => (ast) => {
  ast.__min__ = ++ARAN_COUNTER;
  const tmp = ARAN_CURRENT;
  ARAN_CURRENT = ARAN_COUNTER;
  const res = visitors[ast.type](ast);
  ARAN_CURRENT = tmp;
  ast.__max__ = ARAN_COUNTER;
  return res;
};

exports.expression = visit(Expression);
exports.Statement = visit(Statement);
exports.PROGRAM = visit(Program);
