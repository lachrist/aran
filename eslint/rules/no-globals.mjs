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
      Program: () => {
        const { variables, through } = context.getScope();
        for (const { references } of variables) {
          for (const { identifier } of references) {
            if (!allowed.includes(identifier.name)) {
              context.report({
                node: identifier,
                message: `Forbidden global variable: ${identifier.name}`,
              });
            }
          }
        }
        // Duplicate with no-undef
        // through.forEach(reportReference);
      },
    };
  },
};
