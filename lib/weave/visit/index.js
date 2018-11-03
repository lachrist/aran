
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

const Reflect_defineProperty = Reflect.defineProperty;
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring;
const String_prototype_startsWith = String.prototype.startsWith;

const visit = (visitors) => (parent, scope, node) => {
  if (Reflect_apply(String_prototype_startsWith, node.type, ["Aran"])) {
    node.AranSerial = parent.AranSerial;
    return visitors[Reflect_apply(String_prototype_substring, node.type, [4])](scope, node);
  }
  Reflect_defineProperty(node, "AranParent", {
    value: parent,
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
  node.AranParentSerial = parent ? parent.AranSerial : null;
  node.AranRootSerial = ARAN.root.AranSerial;
  node.AranStrict = (
    (
      parent &&
      parent.AranStrict) ||
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
  return visitors[node.type](scope, node);
};

exports.PROGRAM = visit(Program);
exports.Statement = visit(Statement);
exports.expression = visit(Expression);

exports.$PROGRAM = (parent, scope) => (node) => exports.PROGRAM(scope, parent, node);
exports.$Statement = (parent, scope) => (node) => exports.Statement(scope, parent, node);
exports.$expression = (parent, scope) => (node) => exports.Statement(scope, )
