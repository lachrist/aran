import { some } from "array-lite";

import { assert, hasOwnProperty } from "../util/index.mjs";

const isStrictDirective = (node) =>
  node.type === "ExpressionStatement" &&
  hasOwnProperty(node, "directive") &&
  node.directive === "use strict";

export const isProgramStrict = (node) => {
  assert(node.type === "Program", "expected a program node");
  return node.sourceType === "module" || some(node.body, isStrictDirective);
};

export const isClosureStrict = (node) => {
  assert(
    node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration" ||
      node.type === "ArrowFunctionExpression",
    "expected a closure node",
  );
  return node.type === "ArrowFunctionExpression" && node.expression
    ? false
    : some(node.body.body, isStrictDirective);
};
