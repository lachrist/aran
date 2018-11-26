
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

const Reflect_defineProperty = Reflect.defineProperty;
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring;
const String_prototype_startsWith = String.prototype.startsWith;

const visit = (visitors) => (node, scope) => {
  if (node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "eval" &&
      ArrayLite.every(node.arguments, (argument) => argument.type !== "SpreadElement"))
    node.AranScope = JSON_stringify(scope);
  Reflect_defineProperty(node, "AranParent", {
    value: ARAN.node,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  Reflect_defineProperty(node, "AranRoot", {
    value: ARAN.root,
    configurable: true,
    enumerable: false,
    writable: true
  });
  node.AranParentSerial = ARAN.node ? ARAN.node.AranSerial : null;
  node.AranRootSerial = ARAN.root ? ARAN.node.AranSerial : null;
  node.AranStrict = (
    (
      ARAN.node &&
      ARAN.node.AranStrict) ||
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
  const result = (
    node.type === "FunctionDeclaration" ?
    visitors.FunctionExpression(node, scope) ;
    visitors[node.type](node, scope));
  ARAN.node = temporary;
  return result;
};

exports.Statement = visit(Statement);
exports.expression = visit(Expression);
exports.PROGRAM = visit(Program);

