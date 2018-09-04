
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

const defineProperty = Reflect.defineProperty;

const visit = (visitors) => (node) => {
  defineProperty(node, "AranParent", {
    value: ARAN.node,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  defineProperty(node, "AranRoot", {
    value: ARAN.root,
    configurable: true,
    enumerable: false,
    writable: true
  });
  node.AranParentSerial = node.AranParent.AranSerial;
  node.AranRootSerial = node.AranRoot.AranSerial;
  node.AranStrict = (
    (
      ARAN.node ?
      ARAN.node.AranStrict :
      ARAN.root.AranStrict) ||
    (
      node.type === "Program" &&
      node.body.length &&
      node.body[0].type === "ExpressionStatement" &&
      node.body[0].expression.type === "Literal" &&
      node.body[0].expression.value === "use strict") ||
    (
      (
        node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration" ||
        node.type === "ArrowFunctionExpression") &&
      !node.expression &&
      node.body.body.length &&
      node.body.body[0].type === "ExpressionStatement" &&
      node.body.body[0].expression.type === "Literal" &&
      node.body.body[0].expression.value === "use strict"));
  node.AranSerial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  const temporary = ARAN.node;
  ARAN.node = node;
  const result = visitors[node.type](node);
  ARAN.node = temporary;
  node.AranMaxSerial = ARAN.nodes.length-1;
  return result;
};

exports.PROGRAM = visit(Program);
exports.Statement = visit(Statement);
exports.expression = visit(Expression);
