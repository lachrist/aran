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
  isInitialization,
  getEvalContext,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";

/**
 * @type {(
 *   root: import("../../../type/options.d.ts").Root,
 *   variable: aran.Parameter | unbuild.Variable,
 * ) => string}
 */
const escape = (root, variable) => `${root}.${variable}`;

/**
 * @type {(
 *   node: aran.ControlBlock<unbuild.Atom>,
 *   root: import("../../../type/options.d.ts").Root,
 *   variables: unbuild.Variable[],
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const escapeControlBlock = (node, root, variables) => {
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
        node.tag.path,
      );
};

/**
 * @type {(
 *   node: aran.ClosureBlock<unbuild.Atom>,
 *   root: import("../../../type/options.d.ts").Root,
 *   variables: unbuild.Variable[],
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const escapeClosureBlock = (node, root, variables) => {
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
        node.tag.path,
      );
};

/**
 * @type {(
 *   node: aran.Statement<unbuild.Atom>,
 *   root: import("../../../type/options.d.ts").Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Statement<unbuild.Atom>}
 */
export const escapeStatement = (node, root, variables) => {
  const { path } = node.tag;
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(
        escapeEffect(node.inner, root, variables),
        path,
      );
    case "DeclareGlobalStatement":
      return makeDeclareGlobalStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, root, variables),
        path,
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, root, variables),
        path,
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(
        escapeControlBlock(node.do, root, variables),
        path,
      );
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, root, variables),
        escapeControlBlock(node.then, root, variables),
        escapeControlBlock(node.else, root, variables),
        path,
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, root, variables),
        escapeControlBlock(node.do, root, variables),
        path,
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, root, variables),
        escapeControlBlock(node.catch, root, variables),
        escapeControlBlock(node.finally, root, variables),
        path,
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {(
 *   node: aran.Effect<unbuild.Atom>,
 *   root: import("../../../type/options.d.ts").Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Effect<unbuild.Atom>}
 */
export const escapeEffect = (node, root, variables) => {
  const { path } = node.tag;
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, root, variables),
        path,
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, root, variables),
        map(node.positive, (effect) => escapeEffect(effect, root, variables)),
        map(node.negative, (effect) => escapeEffect(effect, root, variables)),
        path,
      );
    case "WriteEffect":
      return includes(/** @type {string []} */ (variables), node.variable)
        ? makeExpressionEffect(
            makeSetExpression(
              true,
              makeIntrinsicExpression("aran.cache", path),
              makePrimitiveExpression(escape(root, node.variable), path),
              escapeExpression(node.right, root, variables),
              path,
            ),
            path,
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, root, variables),
            isInitialization(node),
            path,
          );
    case "WriteGlobalEffect":
      return makeWriteGlobalEffect(
        node.variable,
        escapeExpression(node.right, root, variables),
        path,
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, root, variables),
        path,
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   root: import("../../../type/options.d.ts").Root,
 *   variables: unbuild.Variable[],
 * ) => aran.Expression<unbuild.Atom>}
 */
export const escapeExpression = (node, root, variables) => {
  const { path } = node.tag;
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
            makeIntrinsicExpression("aran.cache", path),
            makePrimitiveExpression(escape(root, node.variable), path),
            path,
          )
        : makeReadExpression(node.variable, path);
    case "FunctionExpression": {
      return makeFunctionExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, root, variables),
        path,
      );
    }
    case "ReadGlobalExpression":
      return node;
    case "TypeofGlobalExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, root, variables),
        path,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, root, variables),
        path,
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, root, variables),
        escapeExpression(node.tail, root, variables),
        path,
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, root, variables),
        escapeExpression(node.consequent, root, variables),
        escapeExpression(node.alternate, root, variables),
        path,
      );
    case "EvalExpression":
      return makeEvalExpression(
        escapeExpression(node.code, root, variables),
        getEvalContext(node),
        path,
      );
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, root, variables),
        escapeExpression(node.this, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
        path,
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
        path,
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
