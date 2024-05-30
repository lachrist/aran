// builtin curly does not support switch cases

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "layout",
    docs: {
      description: "enforce curly braces in control statements",
      recommended: false,
    },
    fixable: "code",
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /**
     * @type {(
     *   fixer: import("eslint").Rule.RuleFixer,
     *   node: import("estree").Node,
     * ) => import("eslint").Rule.Fix[]}
     */
    const wrap = (fixer, node) => [
      fixer.insertTextBefore(node, "{"),
      fixer.insertTextAfter(node, "}"),
    ];
    /** @type {(node: import("estree").Node & { body: import("estree").Node }) => void} */
    const checkBody = (node) => {
      if (node.body.type !== "BlockStatement") {
        context.report({
          node,
          message: "body should be wrapped in a block statement",
          fix: (fixer) => wrap(fixer, node.body),
        });
      }
    };
    return {
      WithStatement: checkBody,
      WhileStatement: checkBody,
      DoWhileStatement: checkBody,
      ForInStatement: checkBody,
      ForStatement: checkBody,
      ForOfStatement: checkBody,
      IfStatement: (node) => {
        if (node.consequent.type !== "BlockStatement") {
          context.report({
            node,
            message: "consequent should be wrapped in a block statement",
            fix: (fixer) => wrap(fixer, node.consequent),
          });
        }
        if (
          node.alternate != null &&
          node.alternate.type !== "BlockStatement" &&
          node.alternate.type !== "IfStatement"
        ) {
          context.report({
            node,
            message: "alternate should be wrapped in a block statement",
            fix: (fixer) =>
              wrap(
                fixer,
                /** @type {import("estree").Statement} */ (node.alternate),
              ),
          });
        }
      },
      SwitchCase: (node) => {
        if (node.consequent.length === 0) {
          context.report({
            node,
            message: `switch case should not be empty`,
            fix: (fixer) => [fixer.insertTextAfter(node, "{}")],
          });
        } else if (
          node.consequent.length > 1 ||
          node.consequent[0].type !== "BlockStatement"
        ) {
          context.report({
            node,
            message: `switch case should be wrapped in a block statement`,
            fix: (fixer) => [
              fixer.insertTextBefore(node.consequent[0], "{"),
              fixer.insertTextAfter(
                node.consequent[node.consequent.length - 1],
                "}",
              ),
            ],
          });
        }
      },
    };
  },
};
