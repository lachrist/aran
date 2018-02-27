
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const defineProperty = Reflect.defineProperty;

const visit = (visitors) => (node) => {
  defineProperty(node, "AranParent", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: ARAN.parent
  });
  node.AranParentSerial = node.AranParent.AranSerial;
  node.AranStrict = (
    ARAN.parent.AranStrict &&
    (
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration" ||
      node.type === "ArrowFunctionExpression") &&
    !node.expression &&
    node.body.body.length &&
    node.body.body[0].type === "ExpressionStatement" &&
    node.body.body[0].expression.type === "Literal" &&
    node.body.body[0].expression.value === "use strict");
  node.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[node.AranSerial] = node;
  const temporary = ARAN.parent;
  ARAN.parent = node;
  const result = visitors[node.type](node);
  ARAN.parent = temporary;
  node.AranMaxSerial = ARAN.counter;
  return result;
};

exports.Statement = visit(Statement);
exports.expression = visit(Expression);
