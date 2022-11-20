"use strict";

module.exports = {
  rules: {
    // "prefer-else-return": {
    //   meta: {
    //     type: "suggestion",
    //     docs: {
    //       description:
    //         "Opposite of no-else-return -- cf: https://youtu.be/SFv8Wm2HdNM?t=1871",
    //       recommended: false,
    //     },
    //   },
    //   create: (context) => {
    //     const getSingletonBody = ({body}) => [body];
    //     const getBody = ({body}) => body;
    //     const getConsequent = ({consequent}) => consequent;
    //     const getCases = ({cases}) => cases;
    //     const getIfChildren = (node) => [
    //       node.consequent,
    //       node.alternate === null ? [] : [node.alternate],
    //     ];
    //     const getTryChildren = (node) => [
    //       node.block,
    //       ... node.handler === null ? [] : [node.handler],
    //       ... node.finalizer === null ? [] : [node.finalizer],
    //     ];
    //     const return_set = new WeakSet();
    //     const throw_set = new WeakSet();
    //     const sets = [return_set];
    //     const generateRegisterCompletion = (set) => (node) => {
    //       set.add(node);
    //     };
    //     const generateRegisterCompound = (getChildren) => (node) => {
    //       for (const child of getChildren(node)) {
    //         if (return_set.has(child)) {
    //           return_set.add(node);
    //         }
    //         if (throw_set.has(child)) {
    //           throw_set.add(node);
    //         }
    //       }
    //     };
    //     const registerTry = generateRegisterCompound(getTryChildren);
    //     const registerIf = generateRegisterCompound(getIfChildren);
    //     const checkBranch = (node, child1, child2) => {
    //       if (child1 !== null && return_set.has(child1)) {
    //         if (child2 === null || (!return_set.has(child2) && !throw_set.has(child2))) {
    //           context.report({
    //             node,
    //             message:
    //               "If/Try statement has a return statement in one of its branch but no return/throw statement in the other",
    //           });
    //         }
    //       }
    //     };
    //     return {
    //       "ReturnStatement:exit": generateRegisterCompletion(return_set),
    //       "ThrowStatement:exit": generateRegisterCompletion(throw_set),
    //       "BlockStatement:exit": generateRegisterCompound(getBody),
    //       "SwitchCase": generateRegisterCompound(getConsequent),
    //       "SwitchStatement": generateRegisterCompound(getCases),
    //       "IfStatement:exit": (node) => {
    //         registerIf(node);
    //         checkBranch(node, node.consequent, node.alternate);
    //         checkBranch(node, node.alternate, node.consequent);
    //       },
    //       "TryStatement:exit": (node) => {
    //         registerTry(node);
    //         checkBranch(node, node.block, node.handler);
    //         checkBranch(node, node.handler, node.block);
    //       },
    //       "CatchClause:exit": generateRegisterCompound(getSingletonBody),
    //       "LabeledStatement:exit": generateRegisterCompound(getSingletonBody),
    //       "WhileStatement:exit": generateRegisterCompound(getSingletonBody),
    //       "ForInStatement:exit": generateRegisterCompound(getSingletonBody),
    //       "ForOfStatement:exit": generateRegisterCompound(getSingletonBody),
    //     };
    //   },
    // },
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
