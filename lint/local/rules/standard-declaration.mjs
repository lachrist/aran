/** @type {(declarator: import("estree").VariableDeclarator) => boolean} */
const hasInit = ({ init }) => init != null;

/** @type {(declarator: import("estree").VariableDeclarator) => boolean} */
const doesNotHaveInit = ({ init }) => init == null;

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "layout",
    docs: {
      description: "enforce single let/const declaration",
      recommended: false,
    },
    schema: {
      type: "array",
      items: { type: "string" },
    },
  },
  create: (context) => ({
    ClassDeclaration: (node) => {
      context.report({
        node,
        message: "class declarations are forbidden",
      });
    },
    FunctionDeclaration: (node) => {
      context.report({
        node,
        message: "function declarations are forbidden",
      });
    },
    VariableDeclaration: (node) => {
      if (node.kind === "var") {
        context.report({
          node,
          message: "var declarations are forbidden",
        });
      }
      if (node.declarations.length !== 1) {
        context.report({
          node,
          message: "only one declaration per variable declaration",
        });
      }
      node.declarations.every(
        node.parent.type === "ForOfStatement" ||
          node.parent.type === "ForInStatement"
          ? doesNotHaveInit
          : hasInit,
      );
    },
  }),
};
