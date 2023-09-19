"use strict";

const isUniqueComment = (comment) =>
  comment.type === "Block" && /^\*\s+@unique\s*$/gu.test(comment.value);

const isBasenameComment = (comment) =>
  comment.type === "Block" && /^\*\s+@basename\s*$/gu.test(comment.value);

module.exports = {
  rules: {
    "unique-literal": {
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
        const literals = new Set();
        return {
          Literal(node) {
            if (context.getCommentsBefore(node).some(isUniqueComment)) {
              if (node.value instanceof RegExp) {
                context.report({
                  node,
                  message: "RegExp literal cannot be marked as unique",
                });
              } else if (literals.has(node.value)) {
                context.report({
                  node,
                  message: `Duplicate literal ${JSON.stringify(node.value)}`,
                });
              } else {
                literals.add(node.value);
              }
            }
          },
        };
      },
    },
    "basename-literal": {
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
        const segments = context.getFilename().split("/").pop().split(".");
        const basename = segments.slice(0, -1).join(".");
        return {
          Literal(node) {
            if (context.getCommentsBefore(node).some(isBasenameComment)) {
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
    },
    "no-globals": {
      meta: {
        type: "suggestion",
        docs: {
          description: "disallow global variables",
          recommended: false,
        },
        schema: {
          type: "array",
          items: { type: "string" },
        },
      },
      create: (context) => {
        const { options: allowed } = context;
        const reportReference = (reference) => {
          const { identifier } = reference;
          const { name } = identifier;
          if (!allowed.includes(name)) {
            context.report({
              node: identifier,
              message: `Forbidden global variable: ${name}`,
            });
          }
        };
        const reportVariable = ({ references }) => {
          references.forEach(reportReference);
        };
        const isVariableNotDefined = ({ references: { length } }) => length > 0;
        return {
          Program: () => {
            const { variables, through } = context.getScope();
            variables.filter(isVariableNotDefined).forEach(reportVariable);
            // Duplicate with no-undef
            // through.forEach(reportReference);
          },
        };
      },
    },
  },
};
