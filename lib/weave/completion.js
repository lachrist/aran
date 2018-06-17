
const ArrayLite = require("array-lite");

module.exports = (program) => chain(program.body, true);
const visit = (node, last) => visitors[node.type](node, last);
const chain = (nodes, last) => {
  let index = nodes.length;
  while (index--)
    last = visit(nodes[index], last);
  return last;
}
const loop = (node, last) => {
  if (visit(node.body, last) || last)
    node.AranCompletion = true;
  return false;
};

const visitors = {};
visitors.EmptyStatement = (node, last) => last;
visitors.BlockStatement = (node, last) => chain(node.body, last);
visitors.ExpressionStatement = (node, last) => {
  if (last)
    node.AranCompletion = true;
  return false;
};
visitors.IfStatement = (node, last) => {
  const last1 = visit(node.consequent, last);
  const last2 = node.alternate && visit(node.alternate, last);
  if (last1 || last2)
    node.AranCompletion = true;
  return false;
};
visitors.LabeledStatement = (node, last) => chain(node.body, last);
visitors.BreakStatement = (node, last) => true;
visitors.ContinueStatement = (node, last) => true; 
visitors.WithStatement = (node, last) => {
  if (visit(node.body, last))
    node.AranCompletion = true;
  return false;
};
visitors.SwitchStatement = (node, last) => {
  if (ArrayLite.some(node.cases, (clause) => chain(clause.consequent, last)))
    node.AranCompletion = true;
  return false;
};
visitors.ReturnStatement = (node, last) => { throw new Error("Invalid return statement") };
visitors.ThrowStatement = (node, last) => true;
visitors.TryStatement = (node, last) => {
  const last1 = chain(node.block.body, last);
  const last2 = chain(node.handler.body.body, last);
  if (last1 || last2)
    node.AranCompletion = true;
  return false;
};
visitors.WhileStatement = loop;
visitors.DoWhileStatement = (node, last) => {
  if (visit(node.body, last))
    node.AranCompletion = true;
  return false;
};
visitors.ForStatement = loop;
visitors.ForInStatement = loop;
visitors.ForOfStatement = loop;
visitors.DebuggerStatement = (node, last) => last;
visitors.FunctionDeclaration = (ndoe, last) => last;
visitors.VariableDeclaration = (node, last) => last;
