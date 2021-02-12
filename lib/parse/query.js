"use strict";

exports.isDirectEvalCall = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval");

exports.hasUseStrictDirective = (nodes) => {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].type !== "ExpressionStatement") {
      return false;
    }
    if (global_Reflect_getOwnPropertyDescriptor(nodes[index], "directive") === void 0) {
      return false;
    }
    if (nodes[index].directive === "use strict") {
      return true;
    }
  }
  return false;
};