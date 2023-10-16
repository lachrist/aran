/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid empty return",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ReturnStatement: (node) => {
      if (node.argument == null) {
        context.report({ node, message: "empty return is forbidden" });
      }
    },
  }),
};
