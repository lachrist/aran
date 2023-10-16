import { listCommentBefore, parseSimpleTypeAnnotation } from "../comment.mjs";

const { JSON, RegExp, Map, Set } = globalThis;

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
      description: "ensure a literal is unique in the current file",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    const literals = new Map();
    return {
      "Literal": (node) => {
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
      "Program:exit": (_node) => {
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
