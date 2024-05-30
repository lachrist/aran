/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid functions",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: import("estree").Function) => void} */
    const reportFunction = (node) => {
      context.report({ node, message: "functions are forbidden" });
    };
    return {
      FunctionExpression: reportFunction,
      FunctionDeclaration: reportFunction,
    };
  },
};
