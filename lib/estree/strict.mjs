import { some, hasOwn } from "../util/index.mjs";

/** @type {(node: EstreeNode) => boolean} */
const isStrictDirective = (node) =>
  node.type === "ExpressionStatement" &&
  hasOwn(node, "directive") &&
  node.directive === "use strict";

/** @type {(node: EstreeProgram) => boolean} */
export const isProgramStrict = (node) =>
  node.sourceType === "module" || some(node.body, isStrictDirective);

/** @type {(node: EstreeFunction) => boolean} */
export const isClosureStrict = (node) =>
  node.type === "ArrowFunctionExpression" && node.expression
    ? false
    : some(
        /** @type {EstreeBlockStatement} */ (node.body).body,
        isStrictDirective,
      );
