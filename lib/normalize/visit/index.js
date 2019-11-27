
// Short range data are passed as additional arguments.
// Long range data are passed within the scope.

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
exports.NODES = (nodes, scope, labels, context) => {
  if (typeof context === "function") {
    return Block.SwitchBody(nodes, scope, labels, context);
  }
  if (context === "closure") {
    return Block.ClosureBody(nodes, scope, labels);
  }
  if (context === "block") {
    return Body.BlockBody(nodes, scope, labels);
  }
  throw new Error("Invalid context");
};

// Node -> Scope -> [Labels] -> [Statement]
exports.Node = (node, scope, labels) => common(
  node,
  () => Statement[note.type](node, scope, labels));

const options1 = {
  __proto__: null,
  dropped: true,
  name: () => Build.primitive("")
};

const options2 = {
  __proto__: null,
  dropped: true,
  name: () => Build.primitive("")
};

// Node -> Scope -> Identifier -> Expression
exports.node = (node, scope, options) => {
  if (typeof options === boolean) {
    options = options ? options1 : options2;
  } else if (typeof options === "function") {
    options = {
      __proto__: null,
      dropped: false,
      name: options
    };
  }
  if (Query.IsDirectEvalCall(node)) {
    node.AranScope = JSON_stringify(scope),
    node.AranRootSerial = ARAN.root.AranSerial)
  }
  return common(node, () => Expression[node.type](node, scope, options));
};
