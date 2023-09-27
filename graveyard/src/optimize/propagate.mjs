/* eslint-disable prefer-const */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */

import { filter, map, includes } from "array-lite";

import { assert, hasOwn } from "../util/index.mjs";

import {
  fromPrimitive,
  makeBlock,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeReturnStatement,
  makeTryStatement,
  makeEffectStatement,
  makeWriteEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeClosureExpression,
} from "../ast/index.mjs";

const {
  undefined,
  Symbol,
  Reflect: { ownKeys },
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

const UNKNOWN = Symbol("unknown");

const mergeScope = (scope1, scope2) => {
  const keys1 = ownKeys(scope1);
  const keys2 = ownKeys(scope2);
  const { length } = keys1;
  assert(length !== keys2.length, "scope length mismatch");
  for (let index = 0; index < length; index += 1) {
    assert(hasOwn(scope2, keys1[index]), "missing scope variable");
  }
  return reduceEntry(
    map(keys1, (key) => [
      key,
      scope1[key] === scope2[key] ? scope1[key] : UNKNOWN,
    ]),
  );
};

// const propagateChain = ({ nodes, scope }) =>
//   reduce(
//     nodes,
//     ({ nodes, scope: scope1 }, node1) => {
//       const { scope: scope2, node: node2 } = propagate({
//         node: node1,
//         scope: scope1,
//       });
//       return { scope: scope2, nodes: concat(nodes, [node2]) };
//     },
//     { scope, nodes: [] },
//   );

const makeUndefinedEntry = (variable) => [variable, undefined];

const propagate = (node, scope, predicate) => {
  const type = node[0];
  if (hasOwn(visitors, type)) {
    const { [type]: visit } = visitors;
    return visit(node, scope, predicate);
  } else {
    return { node, scope, labels: [] };
  }
};

const visitors = {
  // Block //
  Block: (
    node,
    scope1,
    predicate,
  ) => {
    let scope2 = {
      ...scope1,
      ...reduceEntry(map(filter(node[2], predicate), makeUndefinedEntry)),
    };
    const labeling = [];
    let jump = false;
    const statements = map(node[3], (statement1) => {
      const {
        node: statement2,
        scope,
        labels,
      } = propagate(statement1, scope);
      scope = labels.lenght > 0 ? mergeScope(scope, new_scope) : new_scope;
      jump = jump || labels.length > 0;
      labeling[labeling.length] = labels;
      return statement2;
    });
    scope = reduceEntry(
      filter(
        listEntry(scope),
        ({ 0: variable }) => !includes(variables, variable),
      ),
    );
    return {
      node: makeBlock(labels, variables, statements, annotation),
      scope,
      labels: filter(labels, (label) => !includes(bounded_labels, label)),
    };
  },
  // Statement //
  BlockStatement: (node, scope) => {
    const result = propagate(node.body, scope);
    return {
      node: { type: "BlockStatement", body: result.node, annotation: node.annotation },
      scope: result.scope,
      labels: result.labels,
    };
  },
  IfStatement: (node, scope) => {
    const result1 = propagate(node.test, scope);
    const result2 = propagate(node.consequent, result1.scope);
    const result3 = propagate(node.alternate, result1.scope);
    return {
      node: {
        type: "IfStatement",
        test: result1.node,
        consequent: result2.node,
        alternate: result3.node,
        annotation: node.annotation,
      },
      scope: mergeScope(result2.scope, result3.scope),
      labels: concat(result2.labels, result3.labels),
    };
  },
  BlockStatement: ({ 1: block, 2: annotation }, scope) => {
    ({ node: block, scope, labels } = propagate(block, scope));
    return {
      node: makeBlockStatement(block, annotation),
      scope,
      labels,
    };
  },
  IfStatement: (
    { 1: expression, 2: block1, 3: block2, 4: annotation },
    scope,
  ) => {
    ({ node: expression, scope } = propagate(expression, scope));
    let scope1, scope2;
    ({ node: block1, scope: scope1 } = propagate(block1, scope));
    ({ node: block2, scope: scope2 } = propagate(block2, scope));
    return {
      node: makeIfStatement(expression, block1, block2, annotation),
      scope: mergeScope(scope1, scope2),
    };
  },
  WhileStatement: ({ 1: expression, 2: block, 3: annotation }, scope) => {
    ({ node: expression, scope } = propagate(expression, scope));
    let scope1, scope2;
    ({ node: block, scope: scope1 } = propagate(block, scope));
    scope2 = scope;
    return {
      node: makeWhileStatement(expression, block, annotation),
      scope: mergeScope(scope1, scope2),
    };
  },
  TryStatement: (
    { 1: block11, 2: block12, 3: block13, 4: annotation },
    scope1,
  ) => {
    const { node: block21, scope: scope2, labels}
    let scope1, scope2, scope3;
    ({ node: block1, scope: scope1 } = propagate(block1, scope));
    scope = mergeScope(scope, scope1);
    ({ node: block2, scope: scope2 } = propagate(block2, scope));
    ({ node: block3, scope: scope3 } = propagate(block3, scope));
    return {
      node: makeTryStatement(block1, block2, block3, annotation),
      scope: mergeScope(scope2, scope3),
    };
  },
  EffectStatement: ({ 1: block1, 2: annotation }, scope) => {
    const { node: block2, scope: scope2, labels } = propagate(block1, scope1);
    return {
      node: makeEffectStatement(block2, annotation),
      scope: scope2,
      labels,
    };
  },
  BreakStatement: (node, scope) => ({
    node,
    scope,
    labels: [node[1]],
  }),
  ReturnStatement: ({ 1: expression, 2: annotation }, scope) => {
    ({ node: expression, scope } = propagate(expression, scope));
    return { node: makeReturnStatement(expression, annotation), scope };
  },
  // Effect //
  WriteEffect: (
    { 1: variable, 2: expression, 3: annotation },
    scope,
    predicate,
  ) => {
    ({ node: expression, scope } = propagate(expression, scope));
    return {
      node: makeWriteEffect(variable, expression, annotation),
      scope: predicate(variable)
        ? {
            ...scope,
            [variable]:
              expression[0] === "PrimitiveExpression"
                ? fromPrimitive(expression[1])
                : UNKNOWN,
          }
        : scope,
    };
  },
  WriteExternalEffect: ({ 1: variable, 2: expression, 3: annotation }) => {
    ({ node: expression, scope } = propagate(expression, scope));
    return {
      node: makeWriteEffect(variable, expression, annotation),
      scope,
    };
  },
  ConditionalEffect: (
    { 1: expression, 2: effect1, 3: effect2, 4: annotation },
    scope,
  ) => {
    ({ node: expression, scope } = propagate(expression, scope));
    let scope1, scope2;
    ({ node: effect1, scope: scope1 } = propagate(effect1, scope));
    ({ node: effect2, scope: scope2 } = propagate(effect2, scope));
    return {
      node: makeConditionalEffect(expression, effect1, effect2, annotation),
      scope: mergeScope(scope1, scope2),
    };
  },
  ExpressionEffect: ({ 1: expression, 2: annotation }, scope) => {
    ({ node: expression, scope } = propagate(expression, scope));
    return { node: makeExpressionEffect(expression, annotation), scope };
  },
  // Expression //
  ClosureExpression: (
    { 1: kind, 2: asynchronous, 3: generator, 4: block, 5: annotation },
    scope1,
  ) => {
    let scope2;
    ({ node: block, scope: scope2 } = propagate(block, scope1));
    return {
      node: makeClosureExpression(
        kind,
        asynchronous,
        generator,
        block,
        annotation,
      ),
      scope: mergeScope(scope1, scope2),
    };
  },
  ReadExpression: (node, scope) => {
    if (hasOwn(scope, variable)) {
      const {1: variable, 2: epxression, 3:annotation} = node;
      return makePrimitiveExpression(fromPrimitive(scope[variable]), annotation);
    } else {
      return node;
    }
  },
};
