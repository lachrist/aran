
const Visitors = require("./visitors.js");

module.exports = (ast) => {
  ast.__min__ = ++ARAN_COUNTER;
  const res = Visitors[ast.type](ast);
  ast.__max__ = ARAN_COUNTER;
  return res;
};
