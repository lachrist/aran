import { AranTypeError } from "../error.mjs";
import { flatenTree, map, reduceReverse } from "../util/index.mjs";
import { listDeclaration } from "./declaration.mjs";
import { rebuildEffect } from "./effect.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleLabel, mangleParameter } from "./mangle.mjs";

/** @type {(node: import("estree-sentry").Statement<{}>) => import("estree-sentry").BlockStatement<{}>} */
const wrapBlock = (node) =>
  node.type === "BlockStatement"
    ? node
    : { type: "BlockStatement", body: [node] };

/**
 * @type {(
 *   node: import("estree-sentry").Statement<{}>,
 *   label: import("./atom").Label,
 * ) => import("estree-sentry").Statement<{}>}
 */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: mangleLabel(label),
  body: node,
});

/**
 * @type {(
 *   node: import("./atom").SegmentBlock,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Statement<{}>}
 */
const rebuildSegmentBlock = (node, config) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: flatenTree([
      listDeclaration(node.bindings, config),
      // eslint-disable-next-line no-use-before-define
      map(node.body, (child) => rebuildStatement(child, config)),
    ]),
  });

/**
 * @type {(
 *   node: import("./atom").Statement,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Statement<{}>}
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
    case "EffectStatement": {
      // "use strict" directives are illegal in function with non-simple
      // parameters.
      // NB: "use strict" is a no-op because everything is strict.
      if (
        node.inner.type === "ExpressionEffect" &&
        node.inner.discard.type === "PrimitiveExpression" &&
        node.inner.discard.primitive === "use strict"
      ) {
        return {
          type: "EmptyStatement",
        };
      } else {
        return {
          type: "ExpressionStatement",
          directive: null,
          expression: rebuildEffect(node.inner, config),
        };
      }
    }
    case "BlockStatement": {
      return rebuildSegmentBlock(node.body, config);
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: rebuildExpression(node.test, config),
        consequent: rebuildSegmentBlock(node.then, config),
        alternate: rebuildSegmentBlock(node.else, config),
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        block: wrapBlock(rebuildSegmentBlock(node.try, config)),
        handler: {
          type: "CatchClause",
          param: mangleParameter("catch.error", config),
          body: wrapBlock(rebuildSegmentBlock(node.catch, config)),
        },
        finalizer: wrapBlock(rebuildSegmentBlock(node.finally, config)),
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: rebuildExpression(node.test, config),
        body: rebuildSegmentBlock(node.body, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
