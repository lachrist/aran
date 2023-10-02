/* eslint-disable no-use-before-define */

import {
  StaticError,
  filter,
  includes,
  map,
  removeAll,
} from "../util/index.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";

import {
  makeApplyExpression,
  makeFunctionExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeAwaitExpression,
  makeControlBlock,
  makePseudoBlock,
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
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";

/**
 * @type {(
 *   root: unbuild.Root,
 *   variable: aran.Parameter | weave.ResVariable,
 * ) => estree.Variable}
 */
const escape = (root, variable) =>
  /** @type {estree.Variable} */ (`${root}.${variable}`);

/**
 * @type {(
 *   node: aran.ControlBlock<weave.ResAtom>,
 *   root: unbuild.Root,
 *   variables: weave.ResVariable[],
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
export const escapeControlBlock = (node, root, variables) => {
  const slice = /** @type {weave.ResVariable[]} */ (
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
      );
};

/**
 * @type {(
 *   node: aran.ClosureBlock<weave.ResAtom>,
 *   root: unbuild.Root,
 *   variables: weave.ResVariable[],
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
export const escapeClosureBlock = (node, root, variables) => {
  const slice = filter(
    variables,
    (variable) => !includes(node.variables, variable),
  );
  return slice.length === 0
    ? node
    : makeClosureBlock(
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, root, slice),
        ),
        escapeExpression(node.completion, root, slice),
      );
};

/**
 * @type {(
 *   node: aran.PseudoBlock<weave.ResAtom>,
 *   root: unbuild.Root,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
export const escapePseudoBlock = (node, root) =>
  makePseudoBlock(
    map(node.statements, (statement) =>
      escapeStatement(statement, root, node.tag),
    ),
    escapeExpression(node.completion, root, node.tag),
  );

/**
 * @type {(
 *   node: aran.Statement<weave.ResAtom>,
 *   root: unbuild.Root,
 *   variables: weave.ResVariable[],
 * ) => aran.Statement<weave.ResAtom>}
 */
export const escapeStatement = (node, root, variables) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(escapeEffect(node.inner, root, variables));
    case "DeclareGlobalStatement":
      return makeDeclareGlobalStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, root, variables),
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, root, variables),
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(escapeControlBlock(node.do, root, variables));
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, root, variables),
        escapeControlBlock(node.then, root, variables),
        escapeControlBlock(node.else, root, variables),
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, root, variables),
        escapeControlBlock(node.do, root, variables),
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, root, variables),
        escapeControlBlock(node.catch, root, variables),
        escapeControlBlock(node.finally, root, variables),
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {(
 *   node: aran.Effect<weave.ResAtom>,
 *   root: unbuild.Root,
 *   variables: weave.ResVariable[],
 * ) => aran.Effect<weave.ResAtom>}
 */
export const escapeEffect = (node, root, variables) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, root, variables),
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, root, variables),
        map(node.positive, (effect) => escapeEffect(effect, root, variables)),
        map(node.negative, (effect) => escapeEffect(effect, root, variables)),
      );
    case "WriteEffect":
      return includes(variables, node.variable)
        ? makeExpressionEffect(
            makeSetExpression(
              true,
              makeIntrinsicExpression("aran.hidden.weave"),
              makePrimitiveExpression(escape(root, node.variable)),
              escapeExpression(node.right, root, variables),
            ),
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, root, variables),
          );
    case "WriteGlobalEffect":
      return makeWriteGlobalEffect(
        node.variable,
        escapeExpression(node.right, root, variables),
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, root, variables),
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {(
 *   node: aran.Expression<weave.ResAtom>,
 *   root: unbuild.Root,
 *   variables: weave.ResVariable[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const escapeExpression = (node, root, variables) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ReadExpression":
      return includes(variables, node.variable)
        ? makeGetExpression(
            makeIntrinsicExpression("aran.hidden.weave"),
            makePrimitiveExpression(escape(root, node.variable)),
          )
        : makeReadExpression(node.variable);
    case "FunctionExpression": {
      return makeFunctionExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, root, variables),
      );
    }
    case "ReadGlobalExpression":
      return node;
    case "TypeofGlobalExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, root, variables),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, root, variables),
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, root, variables),
        escapeExpression(node.tail, root, variables),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, root, variables),
        escapeExpression(node.consequent, root, variables),
        escapeExpression(node.alternate, root, variables),
      );
    case "EvalExpression":
      return makeEvalExpression(escapeExpression(node.code, root, variables));
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, root, variables),
        escapeExpression(node.this, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, root, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, variables),
        ),
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
