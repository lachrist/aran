/** @type {(node: estree.Node & { parent: estree.Node}) => boolean} */
const isAllowed = (node) =>
  node.parent.type === "ExpressionStatement" ||
  (node.parent.type === "ForStatement" && node.parent.update === node);

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid assignment in expression context",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    AssignmentExpression: (node) => {
      if (!isAllowed(node)) {
        context.report({
          node,
          message: "assignment expression is forbidden here",
        });
      }
    },
  }),
};
