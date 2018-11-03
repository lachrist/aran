
const Pattern = require("./pattern.js");

module.exports = (type, identifier, patterns) => {


};

//////////////
// Visitors //
//////////////

const visit = (node) => visitors[node.type](node);

const visitors = {};

visitors.EmptyStatement = (node) => [];

visitors.BlockStatement = (node) => ArrayLite.flatenMap(node.body, visit);

visitors.ExpressionStatement = (node) => [];

visitors.IfStatement = (node) => ArrayLite.concat(
  visit(node.consequent),
  node.alternate ? visit(node.alternate) : []);

visitors.LabeledStatement = (node) => ArrayLite.flatenMap(node.body, visit);

visitors.BreakStatement = (node) => [];

visitors.ContinueStatement = (node) => [];

visitors.WithStatement = (node) => visit(node.body);

visitors.ReturnStatement = (node) => [];

visitors.ThrowStatement = (node) => [];

visitors.TryStatment = (node) => ArrayLite.concat(
  visit(node.block),
  node.handler ? visit(node.handler.body) : [],
  node.finalizer ? visit(node.finalizer) : []);

visitors.WhileStatement = (node) => visit(node.body);

visitors.DoWhileStatement = (node) => visit(node.body);

visitors.ForStatement = (node) => ArrayLite.concat(
  node.init && node.init.type === "VariableDeclaration" ? visit(node.init) : [],
  visit(node.body));

visitors.ForInStatement = (node) => ArrayLite.concat(
  node.left && node.left.type === "VariableDeclaration" ? visit(node.init) : [],
  visit(node.body));

visitors.ForOfStatement = (node) => ArrayLite.concat(
  node.left && node.left.type === "VariableDeclaration" ? visit(node.init) : [],
  visit(node.body));

Visitors.FunctionDeclaration = (node) => [node.id.name];

visitors.VariableDeclaration = (node) => (
  node.kind === "var" ?
  ArrayLite.flatenMap(
    node.declarations,
    (declarator) => Pattern(declarator.id)) :
  []);
