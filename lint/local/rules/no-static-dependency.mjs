const { Error } = globalThis;

/**
 * @type {(
 *   context: import("eslint").Rule.RuleContext,
 *   source: estree.Literal,
 * ) => void}
 */
const checkSource = (context, node) => {
  if (typeof node.value !== "string") {
    throw new Error("expected source to be a string");
  }
  if (!node.value.startsWith("./") && !node.value.startsWith("../")) {
    context.report({ node, message: "dependencies are forbidden" });
  }
};

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid static dependencies",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ExportAllDeclaration: (node) => {
      checkSource(context, node.source);
    },
    ExportNamedDeclaration: (node) => {
      if (node.source != null) {
        checkSource(context, node.source);
      }
    },
    ImportDeclaration: (node) => {
      checkSource(context, node.source);
    },
  }),
};
