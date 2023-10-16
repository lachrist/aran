/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid optional chaining",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ChainExpression: (node) => {
      context.report({
        node,
        message: "optional chaining is forbidden",
      });
    },
  }),
};
