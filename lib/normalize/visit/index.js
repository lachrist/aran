
const Global = require("../global.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Closure = require("./closure.js");

const common = (node, closure) => {
  const serial = Global.SERIAL;
  Global.SERIAL = Global.NODES.length;
  Global.NODES[Global.NODES.length] = node;
  const result = closure();
  Global.SERIAL = serial;
  return result;
};

exports.PROGRAM = (node, scope) => common(
  node,
  () => Closure.Program(node, scope));

exports.Node = (node, scope, lexic, labels) => common(
  node,
  () => Statement[note.type](node, scope, lexic, node));

exports.node = (node, scope, boolean, cache) => common(
  node,
  () => Expression[node.type](node, scope, boolean, cache));
