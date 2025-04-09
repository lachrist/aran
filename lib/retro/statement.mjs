import { AranTypeError } from "../error.mjs";
import { flatenTree, map, reduceReverse } from "../util/index.mjs";
import { listDeclaration } from "./declaration.mjs";
import { retroEffect } from "./effect.mjs";
import { retroExpression } from "./expression.mjs";
import { mangleLabel, mangleParameter } from "./mangle.mjs";

/** @type {(node: import("estree-sentry").Statement<{}>) => import("estree-sentry").BlockStatement<{}>} */
const wrapBlock = (node) =>
  node.type === "BlockStatement"
    ? node
    : { type: "BlockStatement", body: [node] };

/**
 * @type {(
 *   node: import("estree-sentry").Statement<{}>,
 *   label: import("./atom.d.ts").Label,
 * ) => import("estree-sentry").Statement<{}>}
 */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: mangleLabel(label),
  body: node,
});

/**
 * @type {(
 *   node: import("./atom.d.ts").SegmentBlock,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
const retroSegmentBlock = (node, config) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: flatenTree([
      listDeclaration(node.bindings, config),
      // eslint-disable-next-line no-use-before-define
      map(node.body, (child) => retroStatement(child, config)),
    ]),
  });

/**
 * @type {(
 *   node: import("./atom.d.ts").Statement,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const retroStatement = (node, config) => {
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
          expression: retroEffect(node.inner, config),
        };
      }
    }
    case "BlockStatement": {
      return retroSegmentBlock(node.body, config);
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: retroExpression(node.test, config),
        consequent: retroSegmentBlock(node.then, config),
        alternate: retroSegmentBlock(node.else, config),
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        block: wrapBlock(retroSegmentBlock(node.try, config)),
        handler: {
          type: "CatchClause",
          param: mangleParameter("catch.error", config),
          body: wrapBlock(retroSegmentBlock(node.catch, config)),
        },
        finalizer: wrapBlock(retroSegmentBlock(node.finally, config)),
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: retroExpression(node.test, config),
        body: retroSegmentBlock(node.body, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
