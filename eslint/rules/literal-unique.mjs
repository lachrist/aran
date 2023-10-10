import { listCommentBefore, parseSimpleTypeAnnotation } from "../comment.mjs";

/**
 * @type {(comment: estree.Comment) => boolean}
 */
const isUniqueComment = (comment) =>
  comment.type === "Block" &&
  parseSimpleTypeAnnotation(comment.value) === "__unique";

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
    const literals = new Map();
    return {
      "Literal"(node) {
        if (listCommentBefore(node, context.sourceCode).some(isUniqueComment)) {
          if (node.value instanceof RegExp) {
            context.report({
              node,
              message: "RegExp literal cannot be marked as unique",
            });
          } else {
            if (!literals.has(node.value)) {
              literals.set(node.value, new Set());
            }
            literals.get(node.value).add(node);
          }
        }
      },
      "Program:exit"(_node) {
        for (const nodes of literals.values()) {
          if (nodes.size > 1) {
            for (const node of nodes) {
              context.report({
                node,
                message: `Duplicate __unique literal ${JSON.stringify(
                  node.value,
                )}`,
              });
            }
          }
        }
      },
    };
  },
};
