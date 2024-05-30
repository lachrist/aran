/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid classes",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: import("estree").Class) => void} */
    const reportClass = (node) => {
      context.report({ node, message: "classes are forbidden" });
    };
    return {
      ClassExpression: reportClass,
      ClassDeclaration: reportClass,
    };
  },
};
