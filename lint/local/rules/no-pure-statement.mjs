/** @type {(node: estree.Node) => boolean} */
const isImpure = (node) =>
  node.type === "CallExpression" ||
  node.type === "AssignmentExpression" ||
  node.type === "UpdateExpression" ||
  node.type === "ImportExpression" ||
  node.type === "AwaitExpression" ||
  node.type === "YieldExpression";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid seemingly pure expression in a statement context",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ExpressionStatement: (node) => {
      if (!isImpure(node.expression)) {
        context.report({
          node,
          message: "seemingly pure expression in a statement context",
        });
      }
    },
    ForStatement: (node) => {
      if (node.update != null && !isImpure(node.update)) {
        context.report({
          node,
          message: "seemingly pure expression in a for-of update context",
        });
      }
    },
  }),
};
