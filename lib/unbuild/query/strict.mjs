import { some, hasNarrowObject } from "../../util/index.mjs";

/** @type {(node: estree.Node) => node is estree.Directive} */
const isDirective = (node) =>
  node.type === "ExpressionStatement" && hasNarrowObject(node, "directive");

/** @type {(node: estree.Node) => boolean} */
const isStrictDirective = (node) =>
  isDirective(node) && node.directive === "use strict";

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
