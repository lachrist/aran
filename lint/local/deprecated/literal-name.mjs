import { listCommentBefore, parseSimpleTypeAnnotation } from "../comment.mjs";

const { RegExp, JSON, Error } = globalThis;

/**
 * @type {(comment: import("estree").Comment) => boolean}
 */
const isNameComment = (comment) =>
  comment.type === "Block" &&
  parseSimpleTypeAnnotation(comment.value) === "__name";

/**
 * @type {(
 *   node: import("eslint").Rule.Node,
 * ) => null | (import("eslint").Rule.Node & {
 *   type: "Property" | "VariableDeclarator",
 * })}
 */
const getParentDefinition = (node) => {
  switch (node.type) {
    case "Program": {
      return null;
    }
    case "Property": {
      return node;
    }
    case "VariableDeclarator": {
      return node;
    }
    default: {
      return getParentDefinition(node.parent);
    }
  }
};

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "ensure a string literal match its closest parent's key value",
      recommended: false,
    },
    schema: {
      type: "array",
      items: { type: "string" },
    },
  },
  create: (context) => ({
    Literal: (node) => {
      if (listCommentBefore(node, context.sourceCode).some(isNameComment)) {
        if (node.value instanceof RegExp) {
          context.report({
            node,
            message: "RegExp literal cannot be marked as key",
          });
        } else {
          const definition = getParentDefinition(node);
          if (definition === null) {
            context.report({
              node,
              message: "Could not find parent definition",
            });
          } else {
            if (definition.type === "Property") {
              if (definition.computed) {
                if (definition.key.type === "Literal") {
                  if (definition.key.value !== node.value) {
                    context.report({
                      node,
                      message: `Key mismatch: ${JSON.stringify(
                        node.value,
                      )} !== ${JSON.stringify(definition.key.value)}`,
                    });
                  }
                } else {
                  context.report({
                    node,
                    message: "Computed parent property",
                  });
                }
              } else {
                if (definition.key.type === "Identifier") {
                  if (definition.key.name !== node.value) {
                    context.report({
                      node,
                      message: `Property key mismatch: ${JSON.stringify(
                        node.value,
                      )} !== ${JSON.stringify(definition.key.name)}`,
                    });
                  }
                } else {
                  throw new Error("Unexpected property key type");
                }
              }
            } else if (definition.type === "VariableDeclarator") {
              if (definition.id.type === "Identifier") {
                if (definition.id.name !== node.value) {
                  context.report({
                    node,
                    message: `Variable key mismatch: ${JSON.stringify(
                      node.value,
                    )} !== ${JSON.stringify(definition.id.name)}`,
                  });
                }
              } else {
                context.report({
                  node,
                  message: "Pattern parent declarator",
                });
              }
            } else {
              throw new Error("unexpected definition node");
            }
          }
        }
      }
    },
  }),
};
