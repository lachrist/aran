
const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const JSON_stringify = JSON.stringify;

module.exports = (node, scope) => {};

const common = (node, closure) => {
  node.AranParentSerial = ARAN.serial;
  node.AranSerial = ARAN.nodes.length;
  ARAN.serial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  const result = closure();
  ARAN.serial = node.AranParentSerial;
  return result;
};

// Node -> Scope -> Block
exports.__NODE__ = (node, scope) => {
  if (node.type !== "Program")
    throw new Error("Visit.__NODE__ should only be called on program node");
  ArrayLite.forEach(Query.CompletionStatements(node), (node) => {
    node.AranCompletion = null;
  });
  return common(node, () => Block.ProgramBody(node.body, scope));
};

// [Node] -> Scope -> [Labels] -> ("closure" | " block" | Scope -> Node -> Block -> Statement) -> Block
exports.NODES = (nodes, scope, labels, context) => (
  typeof context === "function" ?
  Block.SwitchBody(nodes, scope, labels, context) :
  (
    context === "closure" ? 
    Block.ClosureBody(nodes, scope, labels) :
    (
      context === "block" ?
      Body.BlockBody(nodes, scope, labels) :
      ((() => { throw new Error("Invalid context") }) ()))));

// Node -> Scope -> [Labels] -> [Statement]
exports.Node = (node, scope, labels) => common(
  node,
  () => Statement[note.type](node, scope, labels));

// Node -> Scope -> Identifier -> Expression
exports.node = (node, scope, name) => {
  if (Query.IsDirectEvalCall(node)) {
    node.AranScope = JSON_stringify(scope),
    node.AranRootSerial = ARAN.root.AranSerial)
  }
  return common(node, () => Expression[node.type](node, scope, name));
};
