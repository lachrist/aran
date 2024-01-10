import { AranTypeError } from "../error.mjs";
import { isParameter } from "../lang.mjs";
import { map } from "../util/index.mjs";
import { rebuildExpression } from "./expression.mjs";
import { mangleParameter, mangleVariable, mangleExport } from "./mangle.mjs";

/** @type {(nodes: estree.Expression[]) => estree.Expression} */
const sequence = (nodes) => {
  if (nodes.length === 0) {
    return {
      type: "Literal",
      value: null,
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
 *   node: aran.Effect<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const rebuildEffect = (node, config) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return rebuildExpression(node.discard, config);
    }
    case "ConditionalEffect": {
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.condition, config),
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
        left: {
          type: "Identifier",
          name: isParameter(node.variable)
            ? mangleParameter(node.variable)
            : mangleVariable(node.variable),
        },
        right: rebuildExpression(node.right, config),
      };
    }
    case "ExportEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: mangleExport(node.export, config.escape),
        },
        right: rebuildExpression(node.right, config),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
