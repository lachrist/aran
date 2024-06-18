import { AranTypeError } from "../error.mjs";
import { concatXX, map, reduceReverse } from "../util/index.mjs";
import { listDeclaration } from "./declaration.mjs";
import { rebuildEffect } from "./effect.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleLabel, mangleParameter } from "./mangle.mjs";

/** @type {(node: import("../estree").Statement) => import("../estree").BlockStatement} */
const wrapBlock = (node) =>
  node.type === "BlockStatement"
    ? node
    : { type: "BlockStatement", body: [node] };

/**
 * @type {(
 *   node: import("../estree").Statement,
 *   label: import("./atom").Label,
 * ) => import("../estree").Statement}
 */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: mangleLabel(label),
  body: node,
});

/**
 * @type {(
 *   node: import("./atom").ControlBlock,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
const rebuildControlBlock = (node, config) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: concatXX(
      listDeclaration(node.bindings, config),
      // eslint-disable-next-line no-use-before-define
      map(node.body, (child) => rebuildStatement(child, config)),
    ),
  });

/**
 * @type {(
 *   node: import("./atom").Statement,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
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
