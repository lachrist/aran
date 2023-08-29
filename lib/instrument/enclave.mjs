/* eslint-disable no-use-before-define */

import { StaticError, filter, includes, map } from "../util/index.mjs";

import {
  makeApplyExpression,
  makeClosureExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeReadEnclaveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeAwaitExpression,
  makeBlock,
  makeBlockStatement,
  makeConstructExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeReturnStatement,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
  makeWriteEnclaveEffect,
  makeYieldExpression,
} from "./syntax.mjs";

/**
 * @template X
 * @typedef {Record<String, X>} Scope<X>
 */

/** @type {<X>(node: Block<Scope<X>>, escape: string, variables: string[]) => Block<Scope<X>>} */
export const enclaveBlock = (node, escape, variables) => {
  const slice = filter(
    variables,
    (variable) => !includes(node.variables, variable),
  );
  return slice.length === 0
    ? node
    : makeBlock(
        node.labels,
        node.variables,
        map(node.body, (statement) =>
          enclaveStatement(statement, escape, slice),
        ),
      );
};

/** @type {<X>(node: Statement<Scope<X>>, escape: string, variables: string[]) => Statement<Scope<X>>} */
export const enclaveStatement = (node, escape, variables) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(enclaveEffect(node.inner, escape, variables));
    case "DeclareEnclaveStatement":
      return makeDeclareEnclaveStatement(
        node.kind,
        node.variable,
        enclaveExpression(node.value, escape, variables),
      );
    case "ReturnStatement":
      return makeReturnStatement(
        enclaveExpression(node.result, escape, variables),
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(enclaveBlock(node.naked, escape, variables));
    case "IfStatement":
      return makeIfStatement(
        enclaveExpression(node.if, escape, variables),
        enclaveBlock(node.then, escape, variables),
        enclaveBlock(node.else, escape, variables),
      );
    case "WhileStatement":
      return makeWhileStatement(
        enclaveExpression(node.while, escape, variables),
        enclaveBlock(node.loop, escape, variables),
      );
    case "TryStatement":
      return makeTryStatement(
        enclaveBlock(node.try, escape, variables),
        enclaveBlock(node.catch, escape, variables),
        enclaveBlock(node.finally, escape, variables),
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/** @type {<X>(node: Effect<Scope<X>>, escape: string, variables: string[]) => Effect<Scope<X>>} */
export const enclaveEffect = (node, escape, variables) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        enclaveExpression(node.discard, escape, variables),
      );
    case "WriteEffect":
      if (includes(variables, node.variable)) {
        return makeWriteEnclaveEffect(
          `${escape}${node.variable}`,
          enclaveExpression(node.right, escape, variables),
        );
      } else {
        return makeWriteEffect(
          node.variable,
          enclaveExpression(node.right, escape, variables),
          node.tag[node.variable],
        );
      }
    case "WriteEnclaveEffect":
      return makeWriteEnclaveEffect(
        node.variable,
        enclaveExpression(node.right, escape, variables),
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        enclaveExpression(node.right, escape, variables),
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/** @type {<X>(node: Expression<Scope<X>>, escape: string, variables: string[]) => Expression<Scope<X>>} */
export const enclaveExpression = (node, escape, variables) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ParameterExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ReadExpression":
      if (includes(variables, node.variable)) {
        return makeReadEnclaveExpression(`${escape}${node.variable}`);
      } else {
        return makeReadExpression(node.variable, node.tag[node.variable]);
      }
    case "ClosureExpression": {
      const slice = filter(
        variables,
        (variable) => !includes(node.variables, variable),
      );
      return slice.length === 0
        ? node
        : makeClosureExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            node.variables,
            map(node.body, (statement) =>
              enclaveStatement(statement, escape, slice),
            ),
            enclaveExpression(node.completion, escape, slice),
          );
    }
    case "ReadEnclaveExpression":
      return node;
    case "TypeofEnclaveExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        enclaveExpression(node.promise, escape, variables),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        enclaveExpression(node.item, escape, variables),
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        enclaveEffect(node.head, escape, variables),
        enclaveExpression(node.tail, escape, variables),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        enclaveExpression(node.condition, escape, variables),
        enclaveExpression(node.consequent, escape, variables),
        enclaveExpression(node.alternate, escape, variables),
      );
    case "EvalExpression":
      return makeEvalExpression(
        enclaveExpression(node.code, escape, variables),
      );
    case "ApplyExpression":
      return makeApplyExpression(
        enclaveExpression(node.callee, escape, variables),
        enclaveExpression(node.this, escape, variables),
        map(node.arguments, (argument) =>
          enclaveExpression(argument, escape, variables),
        ),
      );
    case "ConstructExpression":
      return makeConstructExpression(
        enclaveExpression(node.callee, escape, variables),
        map(node.arguments, (argument) =>
          enclaveExpression(argument, escape, variables),
        ),
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
