import { AranTypeError } from "../error.mjs";
import { rebuildControlBlock } from "./block.mjs";
import { rebuildEffect } from "./effect.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleLabel, mangleParameter } from "./mangle.mjs";

/** @type {(node: estree.Statement) => estree.BlockStatement} */
const wrapBlock = (node) =>
  node.type === "BlockStatement"
    ? node
    : { type: "BlockStatement", body: [node] };

/**
 * @type {(
 *   node: import("./atom").Statement,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const rebuildStatement = (node, config) => {
  switch (node.type) {
    case "BreakStatement": {
      return {
        type: "BreakStatement",
        label: mangleLabel(node.label),
      };
    }
    case "DebuggerStatement": {
      return {
        type: "DebuggerStatement",
      };
    }
    case "ReturnStatement": {
      return {
        type: "ReturnStatement",
        argument: rebuildExpression(node.result, config),
      };
    }
    case "EffectStatement": {
      return {
        type: "ExpressionStatement",
        expression: rebuildEffect(node.inner, config),
      };
    }
    case "BlockStatement": {
      return rebuildControlBlock(node.body, config);
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: rebuildExpression(node.test, config),
        consequent: rebuildControlBlock(node.then, config),
        alternate: rebuildControlBlock(node.else, config),
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        block: wrapBlock(rebuildControlBlock(node.try, config)),
        handler: {
          type: "CatchClause",
          param: mangleParameter("catch.error", config),
          body: wrapBlock(rebuildControlBlock(node.catch, config)),
        },
        finalizer: wrapBlock(rebuildControlBlock(node.finally, config)),
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: rebuildExpression(node.test, config),
        body: rebuildControlBlock(node.body, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
