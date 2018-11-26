
const ArrayLite = require("array-lite");

const valued = (node) => {
  switch (node.type) {
    case "VariableDeclaration": return false;
    case "FunctionDeclaration": return false;
    case "BreakStatement": return false;
    case "ContinueStatement": return false;
    case "DebuggerStatement": return false;
    case "LabeledStatement": return valued(node.body);
    case "BlockStatement":
      for (let index=0, length=node.body.length; index<length; index++) {
        if (valued(node.body[index])) {
          return true;
        }
      }
      return false;
  }
  return true;
};

const bodies = [
  "LabeledStatement",
  "WithStatement",
  "WhileStatement",
  "DoWhileStatement"
  "ForStatement",
  "ForInStatement",
  "ForOfStatement"
];

module.exports = (node) => {
  do {
    let nodes;
    const parent = node.AranParent;
    if (parent.type === "LabeledStatement" || parent.type === "WithStatement" || parent.type === "WhileStatement" || parent.type === "DoWhileStatement" || parent.type === "ForStatement" || parent.type === "ForInStatement" || parent.type === "ForOfStatement") {
      if (node === parent.body) {
        continue;
      }
      nodes = node.body.body;
    } else if (parent.type === "BlockStatement" || parent.type === "Program") {
      nodes = node.body;
    } else if (parent.type === "IfStatement") {
      if (node === parent.consequent || node === parent.alternate) {
        continue;
      }
      nodes = ArrayLite.includes(parent.consequent.body, node) ?
        parent.consequent.body :
        parent.alternate.body;
    } else if (parent.type === "TryStatement") {
      if (parent.finalizer && ArrayLite.includes(parent.finalizer.body, node)) {
        return false;
      }
      nodes = ArrayLite.includes(parent.block.body, node) ?
        parent.block.body :
        parent.handler.body.body;
    } else if (parent.type === "FunctionExpression" || parent.type === "FunctionDeclaration" || parent.type === "ArrowFunctionExpression") {
      return false;
    } else {
      throw new Error("This should never happen");
    }
    for (let index=nodes.length-1; index>=0; index--) {
      if (nodes[index] === node) {
        break;
      }
      if (valued(nodes[index])) {
        return false;
      }
    }
  } while (node = node.AranParent);
  return true;
};
