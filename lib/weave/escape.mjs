/* eslint-disable no-use-before-define */

import { StaticError, includes, map, removeAll } from "../util/index.mjs";
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

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @type {(
 *   root: import("../../type/options.d.ts").Root,
 *   variable: aran.Parameter | weave.ResVariable,
 * ) => estree.Variable}
 */
const escape = (root, variable) =>
  /** @type {estree.Variable} */ (`${root}.${variable}`);

/**
 * @type {(
 *   node: aran.ControlBlock<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 *   selection: weave.ResVariable[],
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
export const escapeControlBlock = (node, root, parent_selection) => {
  const selection = removeAll(parent_selection, node.variables);
  return selection.length === 0
    ? node
    : makeControlBlock(
        node.labels,
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, root, selection),
        ),
      );
};

/**
 * @type {(
 *   node: aran.ClosureBlock<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 *   selection: weave.ResVariable[],
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
export const escapeClosureBlock = (node, root, parent_selection) => {
  const selection = removeAll(parent_selection, node.variables);
  return selection.length === 0
    ? node
    : makeClosureBlock(
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, root, selection),
        ),
        escapeExpression(node.completion, root, selection),
      );
};

/**
 * @type {(
 *   node: aran.PseudoBlock<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
export const escapePseudoBlock = (node, root) => {
  const selection = /** @type {weave.ResVariable[]} */ (listKey(node.tag));
  return selection.length === 0
    ? node
    : makePseudoBlock(
        map(node.statements, (statement) =>
          escapeStatement(statement, root, selection),
        ),
        escapeExpression(node.completion, root, selection),
      );
};

/**
 * @type {(
 *   node: aran.Statement<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 *   selection: weave.ResVariable[],
 * ) => aran.Statement<weave.ResAtom>}
 */
export const escapeStatement = (node, root, selection) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(escapeEffect(node.inner, root, selection));
    case "DeclareGlobalStatement":
      return makeDeclareGlobalStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, root, selection),
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, root, selection),
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(escapeControlBlock(node.do, root, selection));
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, root, selection),
        escapeControlBlock(node.then, root, selection),
        escapeControlBlock(node.else, root, selection),
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, root, selection),
        escapeControlBlock(node.do, root, selection),
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, root, selection),
        escapeControlBlock(node.catch, root, selection),
        escapeControlBlock(node.finally, root, selection),
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {(
 *   node: aran.Effect<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 *   selection: weave.ResVariable[],
 * ) => aran.Effect<weave.ResAtom>}
 */
export const escapeEffect = (node, root, selection) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, root, selection),
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, root, selection),
        map(node.positive, (effect) => escapeEffect(effect, root, selection)),
        map(node.negative, (effect) => escapeEffect(effect, root, selection)),
      );
    case "WriteEffect":
      return includes(selection, node.variable)
        ? makeExpressionEffect(
            makeSetExpression(
              true,
              makeIntrinsicExpression("aran.hidden.weave"),
              makePrimitiveExpression(escape(root, node.variable)),
              escapeExpression(node.right, root, selection),
            ),
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, root, selection),
            /** @type {any} */ (node.tag)[node.variable],
          );
    case "WriteGlobalEffect":
      return makeWriteGlobalEffect(
        node.variable,
        escapeExpression(node.right, root, selection),
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, root, selection),
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {(
 *   node: aran.Expression<weave.ResAtom>,
 *   root: import("../../type/options.d.ts").Root,
 *   selection: weave.ResVariable[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const escapeExpression = (node, root, selection) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ReadExpression":
      return includes(selection, node.variable)
        ? makeGetExpression(
            makeIntrinsicExpression("aran.hidden.weave"),
            makePrimitiveExpression(escape(root, node.variable)),
          )
        : makeReadExpression(
            node.variable,
            /** @type {any} */ (node.tag)[node.variable],
          );
    case "FunctionExpression": {
      return makeFunctionExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, root, selection),
      );
    }
    case "ReadGlobalExpression":
      return node;
    case "TypeofGlobalExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, root, selection),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, root, selection),
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, root, selection),
        escapeExpression(node.tail, root, selection),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, root, selection),
        escapeExpression(node.consequent, root, selection),
        escapeExpression(node.alternate, root, selection),
      );
    case "EvalExpression":
      return makeEvalExpression(escapeExpression(node.code, root, selection));
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, root, selection),
        escapeExpression(node.this, root, selection),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, selection),
        ),
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, root, selection),
        map(node.arguments, (argument) =>
          escapeExpression(argument, root, selection),
        ),
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
