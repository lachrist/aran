"use strict";

module.exports = {
  rules: {
    "no-globals": {
      meta: {
        type: "suggestion",
        docs: {
          description: "disallow global variables",
          recommended: false,
        },
        schema: {
          type: "array",
          items: {type: "string"},
        },
      },
      create: (context) => {
        const {options:allowed} = context;
        const reportReference = (reference) => {
          const {identifier} = reference;
          const {name} = identifier;
          if (!allowed.includes(name)) {
            context.report({
              node: identifier,
              message: `Forbidden global variable: ${name}`,
            });
          }
        };
        const reportVariable = ({references}) => {
          references.forEach(reportReference);
        };
        const isVariableNotDefined = ({defs:{length}}) => length === 0;
        return {
          Program: () => {
            const {variables, through} = context.getScope();
            variables.filter(isVariableNotDefined).forEach(reportVariable);
            // Duplicate with no-undef
            // through.forEach(reportReference);
          },
        };
      },
    },
  },
};
