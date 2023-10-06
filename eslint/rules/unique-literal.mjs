/**
 * @type {(comment: estree.Comment) => boolean}
 */
const isUniqueComment = (comment) =>
  comment.type === "Block" && /^\*\s+@unique\s*$/gu.test(comment.value);

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "disallow duplicate literals within a single file",
      recommended: false,
    },
    schema: {
      type: "array",
      items: { type: "string" },
    },
  },
  create: (context) => {
    const literals = new Set();
    return {
      Literal(node) {
        if ((node.leadingComments || []).some(isUniqueComment)) {
          if (node.value instanceof RegExp) {
            context.report({
              node,
              message: "RegExp literal cannot be marked as unique",
            });
          } else if (literals.has(node.value)) {
            context.report({
              node,
              message: `Duplicate literal ${JSON.stringify(node.value)}`,
            });
          } else {
            literals.add(node.value);
          }
        }
      },
    };
  },
};
