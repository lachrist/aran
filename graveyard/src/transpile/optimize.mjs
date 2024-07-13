import { includes, some } from "array-lite";
import { partialx_, partialx__ } from "../util";
import { DEFAULT_CLAUSE } from "../node.mjs";
import { getChildren } from "../query.mjs";

const isVariableReadAny = (nodes, variable) =>
  some(nodes, (node) => isVariableRead(node, variable));

const isVariableRead = partialx__(dispatchArrayNode1, {
  Block: ({ 2: variables, 3: statements }, variable) => {
    if (includes(variables, variable)) {
      return false;
    } else {
      return isVariableReadAny(statements, variable);
    }
  },
  ReadExpression: ({ 1: variable1 }, variable2) => variable1 === variable2,
  [DEFAULT_CLAUSE]: (node, variable) =>
    isVariableReadAny(getChildren(node), variable),
});

export const optimizeBlock = partialx_(dispachArrayNode0, {
  Block: ({ 1: labels, 2: variables, 3: statements }, removed, predicate) => {
    const additional_removed = filter(variables, (variable) =>
      isVariableReadAny(statements, variable));
    const new_removed = concat(filter(removed, (variable) => ), additional_removed);
    return makeBlock(
      labels,
      new_variables,
      map(statements, (statement) => optimizeStatement(statement, new_removed, predicate)),
    );
  },
});

export const optimizeStatement = partialx__(dispatchArrayNode1, {});

export const optimizeEffect = partialx__(dispatchArrayNode1, {
  WriteEffect: ({ 1: variable, 2: expression }, removed) => {

  });
});

export const removeShadowVariable = partialx__(dispatchArrayNode1, {});
