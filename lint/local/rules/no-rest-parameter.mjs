/** @type {(node: estree.Pattern) => boolean} */
const isRestParameter = ({ type }) => type === "RestElement";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid rest parameters",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: estree.Function) => void} */
    const reportRestParameter = (node) => {
      if (node.params.some(isRestParameter)) {
        context.report({
          node,
          message: "rest parameters are forbidden",
        });
      }
    };
    return {
      ArrowFunctionExpressio: reportRestParameter,
      FunctionExpression: reportRestParameter,
      FunctionDeclaration: reportRestParameter,
    };
  },
};
