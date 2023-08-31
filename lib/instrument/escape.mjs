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
  makeControlBlock,
  makePseudoBlock,
  makeClosureBlock,
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

/**
 * @type {<X>(
 *   escape: string,
 *   kind: VariableKind,
 *   variable: string,
 *   value: Expression<Scope<X>>,
 * ) => Statement<Scope<X>>}
 */
export const makeEscapeDeclareStatement = (escape, kind, variable, value) =>
  makeDeclareEnclaveStatement(kind, `${escape}${variable}`, value);

/** @type {<X>(node: ControlBlock<Scope<X>>, escape: string, variables: string[]) => ControlBlock<Scope<X>>} */
export const escapeControlBlock = (node, escape, variables) => {
  const slice = filter(
    variables,
    (variable) => !includes(node.variables, variable),
  );
  return slice.length === 0
    ? node
    : makeControlBlock(
        node.labels,
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, escape, slice),
        ),
      );
};

/** @type {<X>(node: ClosureBlock<Scope<X>>, escape: string, variables: string[]) => ClosureBlock<Scope<X>>} */
export const escapeClosureBlock = (node, escape, variables) => {
  const slice = filter(
    variables,
    (variable) => !includes(node.variables, variable),
  );
  return slice.length === 0
    ? node
    : makeClosureBlock(
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, escape, slice),
        ),
        escapeExpression(node.completion, escape, slice),
      );
};

/** @type {<X>(node: PseudoBlock<Scope<X>>, escape: string, variables: string[]) => PseudoBlock<Scope<X>>} */
export const escapePseudoBlock = (node, escape, variables) =>
  makePseudoBlock(
    map(node.statements, (statement) =>
      escapeStatement(statement, escape, variables),
    ),
    escapeExpression(node.completion, escape, variables),
  );

/** @type {<X>(node: Statement<Scope<X>>, escape: string, variables: string[]) => Statement<Scope<X>>} */
export const escapeStatement = (node, escape, variables) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(escapeEffect(node.inner, escape, variables));
    case "DeclareEnclaveStatement":
      return makeDeclareEnclaveStatement(
        node.kind,
        node.variable,
        escapeExpression(node.value, escape, variables),
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, escape, variables),
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(escapeControlBlock(node.do, escape, variables));
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, escape, variables),
        escapeControlBlock(node.then, escape, variables),
        escapeControlBlock(node.else, escape, variables),
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, escape, variables),
        escapeControlBlock(node.do, escape, variables),
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, escape, variables),
        escapeControlBlock(node.catch, escape, variables),
        escapeControlBlock(node.finally, escape, variables),
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/** @type {<X>(node: Effect<Scope<X>>, escape: string, variables: string[]) => Effect<Scope<X>>} */
export const escapeEffect = (node, escape, variables) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, escape, variables),
      );
    case "WriteEffect":
      if (includes(variables, node.variable)) {
        return makeWriteEnclaveEffect(
          `${escape}${node.variable}`,
          escapeExpression(node.right, escape, variables),
        );
      } else {
        return makeWriteEffect(
          node.variable,
          escapeExpression(node.right, escape, variables),
          node.tag[node.variable],
        );
      }
    case "WriteEnclaveEffect":
      return makeWriteEnclaveEffect(
        node.variable,
        escapeExpression(node.right, escape, variables),
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, escape, variables),
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/** @type {<X>(node: Expression<Scope<X>>, escape: string, variables: string[]) => Expression<Scope<X>>} */
export const escapeExpression = (node, escape, variables) => {
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
      return makeClosureExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, escape, variables),
      );
    }
    case "ReadEnclaveExpression":
      return node;
    case "TypeofEnclaveExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, escape, variables),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, escape, variables),
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, escape, variables),
        escapeExpression(node.tail, escape, variables),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, escape, variables),
        escapeExpression(node.consequent, escape, variables),
        escapeExpression(node.alternate, escape, variables),
      );
    case "EvalExpression":
      return makeEvalExpression(escapeExpression(node.code, escape, variables));
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, escape, variables),
        escapeExpression(node.this, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
