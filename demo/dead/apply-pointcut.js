module.exports = (name, node) => (
  name === "apply" &&
  node.type === "CallExpression" &&
  node.callee.type === "Identifier");
