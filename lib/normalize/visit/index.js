
const Global = require("../global.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

const common = (estree_node, closure) => {
  const serial = Global.SERIAL;
  Global.SERIAL = Global.NODES.length;
  Global.NODES[Global.NODES.length] = estree_node;
  const result = closure();
  Global.SERIAL = serial;
  return result;
};

exports.ESTREE_PROGRAM = (estree_program, scope) => common(
  estree_program,
  () => Program[estree_program.type](estree_program, scope));

exports.ESTreeStatement = (estree_statement, scope, lexic, aran_labels) => common(
  node,
  () => Statement[estree_statement.type](estree_statement, scope, lexic, aran_labels));

exports.estree_expression = (estree_expression, scope, boolean, cache) => common(
  node,
  () => Expression[estree_expression.type](estree_expression, scope, boolean, cache));
