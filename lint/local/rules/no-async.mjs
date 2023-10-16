/**
 * @type {import("eslint").Rule.RuleModule}
 */

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid asynchronous functions",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: estree.Function) => void} */
    const reportAsync = (node) => {
      if (node.async) {
        context.report({ node, message: "async functions are forbidden" });
      }
    };
    return {
      AwaitExpression: (node) => {
        context.report({ node, message: "await expressions are forbidden" });
      },
      ArrowFunctionExpression: reportAsync,
      FunctionExpression: reportAsync,
      FunctionDeclaration: reportAsync,
    };
  },
};
