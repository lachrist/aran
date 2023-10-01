/* eslint-disable no-use-before-define */

import { StaticError, includes, map, removeAll } from "../../util/index.mjs";
import { makeGetExpression, makeSetExpression } from "../intrinsic.mjs";

import {
  makeApplyExpression,
  makeFunctionExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeAwaitExpression,
  makeControlBlock,
  makeClosureBlock,
  makeBlockStatement,
  makeConstructExpression,
  makeDeclareGlobalStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeReturnStatement,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
  makeWriteGlobalEffect,
  makeYieldExpression,
  makeConditionalEffect,
  getSerial,
  isInitialization,
  getEvalContext,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";

/**
 * @type {(
 *   root: unbuild.Root,
 *   variable: aran.Parameter | unbuild.Variable,
 * ) => string}
 */
const escape = (root, variable) => `${root}.${variable}`;

/**
 * @type {<S>(
 *   node: aran.ControlBlock<unbuild.Atom<S>>,
 *   root: unbuild.Root,
 *   variables: unbuild.Variable[],
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const escapeControlBlock = (node, root, variables) => {
  const serial = getSerial(node);
  const slice = /** @type {unbuild.Variable[]} */ (
    removeAll(/** @type {string[]} */ (variables), node.variables)
  );
  return slice.length === 0
    ? node
    : makeControlBlock(
        node.labels,
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, root, slice),
        ),
        serial,
      );
};

/**
 * @type {<S>(
 *   node: aran.ClosureBlock<unbuild.Atom<S>>,
 *   root: unbuild.Root,
 *   variables: unbuild.Variable[],
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const escapeClosureBlock = (node, root, variables) => {
  const serial = getSerial(node);
  const slice = /** @type {unbuild.Variable[]} */ (
    removeAll(/** @type {string[]} */ (variables), node.variables)
  );
  return slice.length === 0
    ? node
    : makeClosureBlock(
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, root, slice),
        ),
        escapeExpression(node.completion, root, slice),
        serial,
      );
};

/**
 * @type {<S>(
 *   node: aran.Statement<unbuild.Atom<S>>,
 *   root: unbuild.Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const escapeStatement = (node, root, variables) => {
  const serial = getSerial(node);
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(
        escapeEffect(node.inner, root, variables),
        serial,
      );
    case "DeclareGlobalStatement":
      return makeDeclareGlobalStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, root, variables),
        serial,
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, root, variables),
        serial,
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(
        escapeControlBlock(node.do, root, variables),
        serial,
      );
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, root, variables),
        escapeControlBlock(node.then, root, variables),
        escapeControlBlock(node.else, root, variables),
        serial,
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, root, variables),
        escapeControlBlock(node.do, root, variables),
        serial,
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, root, variables),
        escapeControlBlock(node.catch, root, variables),
        escapeControlBlock(node.finally, root, variables),
        serial,
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {<S>(
 *   node: aran.Effect<unbuild.Atom<S>>,
 *   root: unbuild.Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const escapeEffect = (node, root, variables) => {
  const serial = getSerial(node);
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, root, variables),
        serial,
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, root, variables),
        map(node.positive, (effect) => escapeEffect(effect, root, variables)),
        map(node.negative, (effect) => escapeEffect(effect, root, variables)),
        serial,
      );
    case "WriteEffect":
      return includes(/** @type {string []} */ (variables), node.variable)
        ? makeExpressionEffect(
            makeSetExpression(
              true,
              makeIntrinsicExpression("aran.cache", serial),
              makePrimitiveExpression(escape(root, node.variable), serial),
              escapeExpression(node.right, root, variables),
              serial,
            ),
            serial,
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, root, variables),
            serial,
            isInitialization(node),
          );
    case "WriteGlobalEffect":
      return makeWriteGlobalEffect(
        node.variable,
        escapeExpression(node.right, root, variables),
        serial,
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, root, variables),
        serial,
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {<S>(
 *   node: aran.Expression<unbuild.Atom<S>>,
 *   root: unbuild.Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const escapeExpression = (node, root, variables) => {
  const serial = getSerial(node);
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ReadExpression":
      return includes(/** @type {string[]} */ (variables), node.variable)
        ? makeGetExpression(
            makeIntrinsicExpression("aran.cache", serial),
            makePrimitiveExpression(escape(root, node.variable), serial),
            serial,
          )
        : makeReadExpression(node.variable, getSerial(node));
    case "FunctionExpression": {
      return makeFunctionExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, root, variables),
        serial,
      );
    }
    case "ReadGlobalExpression":
      return node;
    case "TypeofGlobalExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, root, variables),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, root, variables),
        serial,
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, root, variables),
        escapeExpression(node.tail, root, variables),
        serial,
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, root, variables),
        escapeExpression(node.consequent, root, variables),
        escapeExpression(node.alternate, root, variables),
        serial,
      );
    case "EvalExpression":
      return makeEvalExpression(
        escapeExpression(node.code, root, variables),
        serial,
        getEvalContext(node),
      );
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, root, variables),
        escapeExpression(node.this, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
        serial,
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
        serial,
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
