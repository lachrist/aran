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
 *   node: aran.Statement<rebuild.Atom>,
 *   context: import("./context.js").Context,
 * ) => estree.Statement}
 */
export const rebuildStatement = (node, context) => {
  switch (node.type) {
    case "BreakStatement": {
      return {
        type: "BreakStatement",
        label: {
          type: "Identifier",
          name: mangleLabel(node.label),
        },
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
        argument: rebuildExpression(node.result, context),
      };
    }
    case "EffectStatement": {
      return {
        type: "ExpressionStatement",
        expression: rebuildEffect(node.inner, context),
      };
    }
    case "BlockStatement": {
      return rebuildControlBlock(node.do, context);
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: rebuildExpression(node.if, context),
        consequent: rebuildControlBlock(node.then, context),
        alternate: rebuildControlBlock(node.else, context),
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        block: wrapBlock(rebuildControlBlock(node.try, context)),
        handler: {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: mangleParameter("catch.error", context.escape),
          },
          body: wrapBlock(rebuildControlBlock(node.catch, context)),
        },
        finalizer: wrapBlock(rebuildControlBlock(node.finally, context)),
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: rebuildExpression(node.while, context),
        body: rebuildControlBlock(node.do, context),
      };
    }
    default: {
      throw new AranTypeError("invalid statement node", node);
    }
  }
};
