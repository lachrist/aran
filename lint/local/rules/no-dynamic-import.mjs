/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid dynamic import",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ImportExpression: (node) => {
      context.report({ node, message: "dynamic imports are forbidden" });
    },
  }),
};
