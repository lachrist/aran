
exports.BinaryExpression = (node) => {
  visit(node.left);
  visit(node.right);
};

exports.UnaryExpression = (node)

exports.FunctionExpression = (node) => {
  node.AranClosureScope = {
    vars: [],
    lets: [],
    consts: []
  };
  ArrayLite.forEach(node.body.body, (statement) => Visit.statement(statement, node, node.AranClosureScope, false));
};

exports.ArrowFunctionExpression = (node) => {
  node.AranClosureScope = {
    vars: [],
    lets: [],
    consts: []
  };
  if (node.expression) {
    Visit.expression(node.body, node);
  } else {
    ArrayLite.forEach(node.body.body, (statement) => Visit.statement(statement, node, node.AranClosureScope, false));
  }
};
