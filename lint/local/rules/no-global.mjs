/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "disallow global variables",
      recommended: false,
    },
    schema: {
      type: "array",
      items: { type: "string" },
    },
  },
  create: (context) => {
    const { options: allowed } = context;
    return {
      Program: (node) => {
        const { variables, through } = context.sourceCode.getScope(node);
        for (const { references } of variables) {
          for (const { identifier } of references) {
            if (!allowed.includes(identifier.name)) {
              context.report({
                node: identifier,
                message: `global variable are forbidden: ${identifier.name}`,
              });
            }
          }
        }
        for (const { identifier } of through) {
          if (!allowed.includes(identifier.name)) {
            context.report({
              node: identifier,
              message: `undefined global variable: ${identifier.name}`,
            });
          }
        }
      },
    };
  },
};
