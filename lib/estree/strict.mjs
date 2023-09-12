import { some, hasOwn } from "../util/index.mjs";

/** @type {(node: estree.Node) => boolean} */
const isStrictDirective = (node) =>
  node.type === "ExpressionStatement" &&
  hasOwn(node, "directive") &&
  node.directive === "use strict";

/** @type {(node: estree.Program) => boolean} */
export const isProgramStrict = (node) =>
  node.sourceType === "module" || some(node.body, isStrictDirective);

/** @type {(node: estree.Function) => boolean} */
export const isClosureStrict = (node) =>
  node.type === "ArrowFunctionExpression" && node.expression
    ? false
    : some(
        /** @type {estree.BlockStatement} */ (node.body).body,
        isStrictDirective,
      );
