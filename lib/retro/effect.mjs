import { AranTypeError } from "../error.mjs";
import { isParameter } from "../lang/index.mjs";
import { map } from "../util/index.mjs";
import { retroExpression } from "./expression.mjs";
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
 *   config: import("./config").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const retroEffect = (node, config) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return retroExpression(node.discard, config);
    }
    case "ConditionalEffect": {
      return {
        type: "ConditionalExpression",
        test: retroExpression(node.test, config),
        consequent: sequence(
          map(node.positive, (effect) => retroEffect(effect, config)),
        ),
        alternate: sequence(
          map(node.negative, (effect) => retroEffect(effect, config)),
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
        right: retroExpression(node.value, config),
      };
    }
    case "ExportEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: mangleExport(node.export, config),
        right: retroExpression(node.value, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
