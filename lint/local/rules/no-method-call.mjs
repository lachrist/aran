/** @type {(node: import("estree").Expression | import("estree").Super) => boolean} */
const isConsole = (node) =>
  node.type === "Identifier" && node.name === "console";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid method call",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    CallExpression: (node) => {
      if (
        node.callee.type === "MemberExpression" &&
        !isConsole(node.callee.object)
      ) {
        context.report({
          node,
          message: `method call are forbidden`,
        });
      }
    },
  }),
};
