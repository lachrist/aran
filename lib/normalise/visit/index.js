
const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const Array_isArray = Array.isArray;
const JSON_stringify = JSON.stringify;

const common = (visitors, node, scope, context) => {
  const temporary = ARAN.serial;
  ARAN.serial = ARAN.nodes.length;
  node.AranSerial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  const result = visitors[node.type](node, scope, context);
  ARAN.serial = temporary;
  return result;
};

exports.NODE = (node, scope, boolean) => {
  if (Array_isArray(node)) {
    return Block["BlockStatement"]({
      type: "BlockStatement",
      body: ArrayLite.flatMap(node, (node) => ArrayLite.concat([node], node.consequent))
    }, scope, boolean);
  }
  if (node.type === "Program") {
    ArrayLite.forEach(Query.CompletionStatements(node), (node) => {
      node.AranCompletion = null;
    });
  }
  if (node.type === "Program" || node.type === "BlockStatement")
    return common(Block, node, scope, boolean);
  return Block[node.type](node, scope, boolean);
};

exports.Node = (node, scope) => {
  if (node.type === "BlockStatement")
    return Statement.BlockStatement(node, scope);
  return common(Statement, node, scope);
};

exports.node = (node, scope, name) => (
  (    
    (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "eval" &&
      ArrayLite.every(
        node.arguments,
        (node) => node.type !== "SpreadElements")) ?
    (
      node.AranScope = JSON_stringify(scope),
      node.AranRootSerial = ARAN.root.AranSerial) :
    null),
  common(Expression, node, scope, name));
