
module.exports = (node, context, parent) => {
  node.AranSerial = context.nodes.length;
  Reflect_defineProperty(
    node

};


const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const Object_assign = Object.assign;
const Reflect_defineProperty = Reflect.defineProperty;
const JSON_stringify = JSON.stringify;

module.exports (node, parent, context) => {
  Reflect_defineProperty(node, "AranParent", {
    value: parent,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  Reflect_defineProperty(context.root, "AranRoot", {
    value: context.root,
    configurable: true,
    enumerable: false,
    writable: true
  });
  node.AranParentSerial = parent ? parent.AranSerial : null;
  node.AranRootSerial = ARAN.root ? ARAN.root.AranSerial : null;
  if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration" || node.type === "ArrowFunctionExpression")
    node.AranStrict = ARAN.node.AranStrict || Query.IsStrictBody(node.body);
  else
    node.AranStrict = ARAN.node.AranStrict;
  node.AranSerial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  if (Query.IsDirectEvalCall(node))
    node.AranScope = JSON_stringify(scope);
  const temporary = ARAN.node;
  ARAN.node = node;
  const result = visitors[node.type](node, scope);
  ARAN.node = temporary;
  return result;
};

exports.NODES = Block;

exports.Node = visit(Statement);

exports.node = visit(
  Object_assign(
    {
      FunctionDeclaration: Expression.FunctionExpression},
    Expression));
