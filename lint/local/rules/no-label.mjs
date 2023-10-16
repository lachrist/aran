/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid label",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    LabeledStatement: (node) => {
      context.report({
        node,
        message: "label statements are forbidden",
      });
    },
    ContinueStatement: (node) => {
      context.report({
        node,
        message: "continue statements are forbidden",
      });
    },
    BreakStatement: (node) => {
      context.report({
        node,
        message: "break statements are forbidden",
      });
    },
  }),
};
