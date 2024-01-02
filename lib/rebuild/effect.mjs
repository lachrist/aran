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
 *   context: import("./context.js").Context,
 * ) => estree.Expression}
 */
export const rebuildEffect = (node, context) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return rebuildExpression(node.discard, context);
    }
    case "ConditionalEffect": {
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.condition, context),
        consequent: sequence(
          map(node.positive, (effect) => rebuildEffect(effect, context)),
        ),
        alternate: sequence(
          map(node.negative, (effect) => rebuildEffect(effect, context)),
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
            ? mangleParameter(node.variable, context.escape)
            : mangleVariable(node.variable, context.escape),
        },
        right: rebuildExpression(node.right, context),
      };
    }
    case "ExportEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: mangleExport(node.export, context.escape),
        },
        right: rebuildExpression(node.right, context),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
