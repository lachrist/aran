import { isNextMetaAssignment } from "../site.mjs";

/** @type {(node: import("estree").Node & { parent: import("estree").Node}) => boolean} */
const isUpdateAssignment = (node) =>
  node.parent.type === "ExpressionStatement" ||
  (node.parent.type === "ForStatement" && node.parent.update === node);

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid assignment in expression context",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    AssignmentExpression: (node) => {
      if (!isUpdateAssignment(node) && !isNextMetaAssignment(node)) {
        context.report({
          node,
          message: "assignment expression is forbidden here",
        });
      }
    },
  }),
};
