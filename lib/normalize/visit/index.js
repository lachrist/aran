
// Short range data are passed as options.
// Long range data are passed within the scope.

const ArrayLite = require("array-lite");
const Scope = require("../scope.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const global_Object_assign = global.Object.assign;

const common = (node, closure) => {
  const serial = Global.SERIAL;
  Global.SERIAL = Global.NODES.length;
  Global.NODES[Global.NODES.length] = node;
  const result = closure();
  Global.SERIAL = serial;
  return result;
};

exports.NODE = (node, scope, tag, labels, cache) => (
  node === null ?
  Block([], scope, tag, labels, cache) :
  (
    (
      (closure) => (
        node.type === "Program" ?
        common(
          node,
          () => closure(node)) :
        closure(node))
    (
      function self (node) { return (
        (
          node.type === "Program" ||
          node.type === "Block") ?
        (
          node.body.length === 1 ?
          self(node.body[0]) :
          Block(node.body, scope, tag, labels, cache)) :
        (
          node.type === "LabeledStatement" ?
          (
            labels = ArrayLite.concat(labels, [node.label.name]),
            self(node.body)) :
          Block([node], scope, tag, labels, cache)))}))));

exports.Node = (node, scope, labels) => common(
  node,
  () => Statement[note.type](node, scope, node));

exports.node = (node, scope, boolean, cache) => (
  (
    (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "eval" &&
      ArrayLite.every(
        node.callee.arguments,
        (argument) => argument.type !== "SpreadElement")) ?
    (
      Global.EVALS = Scope.$Stringify(scope)) :
    void 0),
  common(
    node,
    () => Expression[node.type](node, scope, boolean, cache)));
