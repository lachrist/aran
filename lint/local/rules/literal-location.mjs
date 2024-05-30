import { relative } from "node:path";
import { listCommentBefore, parseSimpleTypeAnnotation } from "../comment.mjs";

const { JSON } = globalThis;

/**
 * @type {(comment: import("estree").Comment) => boolean}
 */
const isLocationComment = (comment) =>
  comment.type === "Block" &&
  parseSimpleTypeAnnotation(comment.value) === "__location";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "ensure a string literal match the current location",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    const location = relative(context.cwd, context.filename);
    return {
      Literal: (node) => {
        if (
          listCommentBefore(node, context.sourceCode).some(isLocationComment)
        ) {
          if (node.value !== location) {
            context.report({
              node,
              message: `Expected basename string literal ${JSON.stringify(
                node.value,
              )} to be ${JSON.stringify(location)}`,
            });
          }
        }
      },
    };
  },
};
