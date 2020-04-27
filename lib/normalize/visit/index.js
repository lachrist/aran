
const State = require("../state.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

exports.esprogram = (program_estree, scope) => State.visit(
  program_estree,
  () => Program[estree_program.type](estree_program, scope));

exports.esstatement = (statement_estree, scope, lexic, aran_labels) => State.visit(
  statement_estree,
  () => Statement[estree_statement.type](estree_statement, scope, lexic, aran_labels));

exports.esexpression = (estree_expression, scope, boolean, cache) => State.visit(
  statement_estree,
  () => Expression[estree_expression.type](estree_expression, scope, boolean, cache));
