import { isNextMetaAssignment } from "../site.mjs";

/** @type {(node: import("estree").ExpressionStatement) => boolean} */
const isConsoleStatement = (node) =>
  node.expression.type === "CallExpression" &&
  node.expression.callee.type === "MemberExpression" &&
  node.expression.callee.object.type === "Identifier" &&
  node.expression.callee.object.name === "console";

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid impure stuff",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    /** @type {(node: import("estree").Node) => void} */
    const reportImpure = (node) => {
      context.report({
        node,
        message: `${node.type} are forbidden`,
      });
    };
    return {
      AssignmentExpression: (node) => {
        if (!isNextMetaAssignment(node)) {
          reportImpure(node);
        }
      },
      ExpressionStatement: (node) => {
        if (
          !isConsoleStatement(node) &&
          node.expression.type !== "AwaitExpression" &&
          node.expression.type !== "YieldExpression"
        ) {
          reportImpure(node);
        }
      },
      ForStatement: reportImpure,
      WhileStatement: reportImpure,
      DoWhileStatement: reportImpure,
    };
  },
};
