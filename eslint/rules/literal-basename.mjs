import { listCommentBefore, parseSimpleTypeAnnotation } from "../comment.mjs";

/**
 * @type {(comment: estree.Comment) => boolean}
 */
const isBasenameComment = (comment) =>
  comment.type === "Block" &&
  parseSimpleTypeAnnotation(comment.value) === "__basename";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "ensure a string literal match the current basename",
      recommended: false,
    },
    schema: {
      type: "array",
      items: { type: "string" },
    },
  },
  create: (context) => {
    const segments = /** @type {string} */ (
      context.filename.split("/").pop()
    ).split(".");
    const basename = segments.slice(0, -1).join(".");
    return {
      Literal(node) {
        if (
          listCommentBefore(node, context.sourceCode).some(isBasenameComment)
        ) {
          if (node.value !== basename) {
            context.report({
              node,
              message: `Expected basename string literal ${JSON.stringify(
                node.value,
              )} to be ${JSON.stringify(basename)}`,
            });
          }
        }
      },
    };
  },
};
