/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Forbid @typedef jsdoc comments. They are not intelisensed.",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    for (const comment of context.sourceCode.getAllComments()) {
      if (
        comment.type === "Block" &&
        comment.value.length > 0 &&
        comment.value[0] === "*"
      ) {
        if (comment.value.includes("@typedef")) {
          context.report({
            loc: comment.loc ?? { line: 0, column: 0 },
            message:
              "Do not use @typedef jsdoc comments, instead declare types in a .d.ts file",
          });
        }
      }
    }
    return {};
  },
};
