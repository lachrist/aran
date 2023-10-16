const { undefined } = globalThis;

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "consider console as a keyword",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    Identifier: (node) => {
      if (node.name === "console") {
        if (
          node.parent.type === "MemberExpression" &&
          node.parent.object === node &&
          node.parent.parent.type === "CallExpression"
        ) {
          return undefined;
        }
        if (
          node.parent.type === "MemberExpression" &&
          node.parent.property === node
        ) {
          return undefined;
        }
        if (node.parent.type === "Property" && node.parent.key === node) {
          return undefined;
        }
        if (
          node.parent.type === "PropertyDefinition" &&
          node.parent.left === node
        ) {
          return undefined;
        }
        if (
          node.parent.type === "MethodDefinition" &&
          node.parent.key === node
        ) {
          return undefined;
        }
        context.report({
          node,
          message: "console can only accessed as part of a method invocation",
        });
        return undefined;
      }
    },
  }),
};
