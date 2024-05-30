/** @type {(node: import("estree").Pattern) => boolean} */
const isOptionalParameter = ({ type }) => type === "AssignmentPattern";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid optional parameters",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: import("estree").Function) => void} */
    const reportOptionalParameter = (node) => {
      if (node.params.some(isOptionalParameter)) {
        context.report({
          node,
          message: "optional parameters are forbidden",
        });
      }
    };
    return {
      ArrowFunctionExpressio: reportOptionalParameter,
      FunctionExpression: reportOptionalParameter,
      FunctionDeclaration: reportOptionalParameter,
    };
  },
};
