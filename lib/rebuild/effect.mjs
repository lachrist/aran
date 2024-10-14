import { AranTypeError } from "../report.mjs";
import { isParameter } from "../lang/index.mjs";
import { map } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleParameter, mangleVariable, mangleExport } from "./mangle.mjs";
import { makeSimpleLiteral } from "./literal.mjs";

/**
 * @type {(
 *   nodes: import("estree-sentry").Expression<{}>[],
 * ) => import("estree-sentry").Expression<{}>}
 */
const sequence = (nodes) => {
  if (nodes.length === 0) {
    return {
      type: "UnaryExpression",
      operator: "void",
      prefix: true,
      argument: makeSimpleLiteral(null),
    };
  } else if (nodes.length === 1) {
    return nodes[0];
  } else {
    return {
      type: "SequenceExpression",
      expressions: nodes,
    };
  }
};

/**
 * @type {(
 *   node: import("./atom").Effect,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const rebuildEffect = (node, config) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return rebuildExpression(node.discard, config);
    }
    case "ConditionalEffect": {
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.test, config),
        consequent: sequence(
          map(node.positive, (effect) => rebuildEffect(effect, config)),
        ),
        alternate: sequence(
          map(node.negative, (effect) => rebuildEffect(effect, config)),
        ),
      };
    }
    case "WriteEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: isParameter(node.variable)
          ? mangleParameter(node.variable, config)
          : mangleVariable(node.variable, config),
        right: rebuildExpression(node.value, config),
      };
    }
    case "ExportEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: mangleExport(node.export, config),
        right: rebuildExpression(node.value, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
