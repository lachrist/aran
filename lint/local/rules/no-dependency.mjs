const { Error } = globalThis;

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid dependencies",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ImportExpression: (node) => {
      context.report({ node, message: "import expression are forbidden" });
    },
    ImportDeclaration: (node) => {
      if (typeof node.source.value !== "string") {
        throw new Error("expected source to be a string");
      }
      if (
        !node.source.value.startsWith("./") &&
        !node.source.value.startsWith("../")
      ) {
        context.report({ node, message: "dependencies are forbidden" });
      }
    },
  }),
};
