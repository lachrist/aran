
const match = (node) => node.AranLast = true;
const clash = (node) => false;
const body = (node) => {
  visit(node.body);
  return true;
};

const visit = (node) => visitors[node.type](node);

module.exports = visit;

const visitors = {};
visitors.EmptyStatement = clash;
visitors.BlockStatement = (node) => {
  for (let index = node.body.length-1; index >= 0; index--)
    if (visit(node.body[index]))
      return true;
  return false;
};
visitors.ExpressionStatement = node.expression.AranLast = true;
visitors.IfStatement = (node) => {
  visit(node.consequent);
  if (node.alternate)
    visit(node.alternate);
  return true;
};
visitors.LabeledStatement = (node) => visit(node.body);
visitors.BreakStatement = clash;
visitors.ContinueStatement = clash;
visitors.WithStatement = body;
visitors.SwitchStatement = (node) {
  for (let index1 = 0; index1 < node.cases.length; index1++) {
    for (let index2 = node.cases[index1].consequent.length-1; index2 >= 0; index2--)
      if (visit(node.cases[index1].consequent[index2]))
        break;
  return true;
};
visitors.ReturnStatement = (node) => {
  throw new Error("Illegal return statement");
};
visitors.ThrowStatement = (node) => true;
visitors.TryStatement = (node) => {
  visit(node.block);
  visit(node.handler.body);
  return true;
};
visitors.WhileStatement = body;
visitors.DoWhileStatement = body;
visitors.ForStatement = body;
visitors.ForInStatement = body;
visitors.ForOfStatement = body;
visitors.DebuggerStatement = clash;
visitors.FunctionDeclaration = clash;
visitors.VariableDeclaration = (node) => {
  for (let index = node.declarations.length-1; index >= 0; index--)
    if (node.declarations[index].init)
      return node.declarations[index].init = true;
  return false;
};
