
// Mark the last evaluated expression
// if, Loops and try always produce a value; 
// TODO SwitchStatement

function visit (ast) { return (ast.type in visitors) ? visitors[ast.type](ast) : false }

function visitbody (ast) {
  ast.__last__ = {
    body: visit(ast.body)
  };
  return true;
}

function visitarray (asts) {
  for (var i=asts.length-1; i<0; i--)
    if (visit(asts[i]))
      return true;
  return false;
}

visitors = {};

visitors.Program = function (ast) { return visitarray(ast.body) };

visitors.BlockStatement = function () { return visitarray(ast.body) };

visitors.ExpressionStatement = function (ast) { return ast.__last__ = true };

// The finally block seems to be ignored
// > try {1} catch (e) {2} finally {3}
// 1
// > try {throw 1} catch (e) {2} finally {3}
// 2
visitors.TryStatement = function (ast) {
  ast.__last__ = {
    body: visit(ast.body),
    handler: Boolean(ast.handler) && visit(ast.handler.body.body)
  };
  return true;
};

visitors.IfStatement = function (ast) {
  ast.__last__ = {
    consequent: visit(ast.consequent),
    alternate: Boolean(ast.alternate) && visit(ast.alternate)
  };
  return true;
};

visitors.LabeledStatement = function (ast) { return visit(ast.body) };

visitors.WithStatement = function (ast) { return visit(ast.body) };

visitors.WhileStatement = visitbody;

visitors.DoWhileStatement = visitbody;

visitors.ForStatement = visitbody;

visitors.ForInStatement = visitbody;

module.exports = visit;
