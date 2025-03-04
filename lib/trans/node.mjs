// This unfortunate file is necessary because ts shokes too much when node
// builders are generic.

import {
  makeProgram as makeProgramGeneric,
  makeSegmentBlock as makeSegmentBlockGeneric,
  makeRoutineBlock as makeRoutineBlockGeneric,
  makeEffectStatement as makeEffectStatementGeneric,
  makeDebuggerStatement as makeDebuggerStatementGeneric,
  makeBreakStatement as makeBreakStatementGeneric,
  makeBlockStatement as makeBlockStatementGeneric,
  makeIfStatement as makeIfStatementGeneric,
  makeTryStatement as makeTryStatementGeneric,
  makeWhileStatement as makeWhileStatementGeneric,
  makeExpressionEffect as makeExpressionEffectGeneric,
  makeConditionalEffect as makeConditionalEffectGeneric,
  makeWriteEffect as makeWriteEffectGeneric,
  makeExportEffect as makeExportEffectGeneric,
  makePrimitiveExpression as makePrimitiveExpressionGeneric,
  makeImportExpression as makeImportExpressionGeneric,
  makeIntrinsicExpression as makeIntrinsicExpressionGeneric,
  makeReadExpression as makeReadExpressionGeneric,
  makeClosureExpression as makeClosureExpressionGeneric,
  makeAwaitExpression as makeAwaitExpressionGeneric,
  makeYieldExpression as makeYieldExpressionGeneric,
  makeSequenceExpression as makeSequenceExpressionGeneric,
  makeConditionalExpression as makeConditionalExpressionGeneric,
  makeEvalExpression as makeEvalExpressionGeneric,
  makeApplyExpression as makeApplyExpressionGeneric,
  makeConstructExpression as makeConstructExpressionGeneric,
} from "../lang/index.mjs";
import { flatenTree, mapTree } from "../util/index.mjs";

/////////////
// Program //
/////////////

/**
 * @type {typeof import("../lang/node.mjs").makeProgram<import("./atom").Atom>}
 */
export const makeProgram = makeProgramGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeSegmentBlock<import("./atom").Atom>}
 */
export const makeSegmentBlock = makeSegmentBlockGeneric;

/**
 * @type {(
 *   labels: import("../util/tree").Tree<import("./atom").Label>,
 *   bindings: [import("./variable").Variable, import("../lang/syntax").Intrinsic][],
 *   body: import("../util/tree").Tree<import("./atom").Statement>,
 *   tag: import("./hash").Hash,
 * ) => import("./atom").TreeSegmentBlock}
 */
export const makeTreeSegmentBlock = (labels, bindings, body, tag) => ({
  type: "SegmentBlock",
  labels,
  bindings,
  body,
  tag,
});

/**
 * @type {typeof import("../lang/node.mjs").makeRoutineBlock<import("./atom").Atom>}
 */
export const makeRoutineBlock = makeRoutineBlockGeneric;

/**
 * @type {(
 *   bindings: [import("./variable").Variable, import("../lang/syntax").Intrinsic][],
 *   head: import("../util/tree").Tree<import("./atom").Effect>,
 *   body: import("../util/tree").Tree<import("./atom").Statement>,
 *   tail: import("./atom").Expression,
 *   tag: import("./hash").Hash,
 * ) => import("./atom").TreeRoutineBlock}
 */
export const makeTreeRoutineBlock = (bindings, head, body, tail, tag) => ({
  type: "RoutineBlock",
  head,
  bindings,
  body,
  tail,
  tag,
});

/**
 * @type {typeof import("../lang/node.mjs").makeEffectStatement<import("./atom").Atom>}
 */
export const makeEffectStatement = makeEffectStatementGeneric;

/**
 * @type {(
 *   nodes: import("../util/tree").Tree<import("./atom").Effect>,
 *   tag: import("./hash").Hash,
 * ) => import("./atom").Statement[]}
 */
export const listEffectStatement = (nodes, tag) =>
  mapTree(nodes, (node) => makeEffectStatement(node, tag));

/**
 * @type {typeof import("../lang/node.mjs").makeDebuggerStatement<import("./atom").Atom>}
 */
export const makeDebuggerStatement = makeDebuggerStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeBreakStatement<import("./atom").Atom>}
 */
export const makeBreakStatement = makeBreakStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeBlockStatement<import("./atom").Atom>}
 */
export const makeBlockStatement = makeBlockStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeIfStatement<import("./atom").Atom>}
 */
export const makeIfStatement = makeIfStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeTryStatement<import("./atom").Atom>}
 */
export const makeTryStatement = makeTryStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeWhileStatement<import("./atom").Atom>}
 */

export const makeWhileStatement = makeWhileStatementGeneric;

////////////
// Effect //
////////////

/**
 * @type {typeof import("../lang/node.mjs").makeExpressionEffect<import("./atom").Atom>}
 */
export const makeExpressionEffect = makeExpressionEffectGeneric;

/**
 * @type {(
 *   node: import("./atom").Expression,
 *   hash: import("./hash").Hash,
 * ) => import("../util/tree").Tree<import("./atom").Effect>}
 */
export const listExpressionEffect = (node, tag) => {
  const { type } = node;
  if (
    type === "IntrinsicExpression" ||
    type === "ReadExpression" ||
    type === "PrimitiveExpression"
  ) {
    return null;
  } else {
    return makeExpressionEffect(node, tag);
  }
};

/**
 * @type {typeof import("../lang/node.mjs").makeConditionalEffect<import("./atom").Atom>}
 */
export const makeConditionalEffect = makeConditionalEffectGeneric;

/**
 * @type {(
 *   test: import("./atom").Expression,
 *   consequent: import("../util/tree").Tree<import("./atom").Effect>,
 *   alternate: import("../util/tree").Tree<import("./atom").Effect>,
 *   hash: import("./hash").Hash,
 * ) => import("./atom").Effect}
 */
export const makeTreeConditionalEffect = (test, consequent, alternate, hash) =>
  makeConditionalEffect(
    test,
    flatenTree(consequent),
    flatenTree(alternate),
    hash,
  );

/**
 * @type {typeof import("../lang/node.mjs").makeWriteEffect<import("./atom").Atom>}
 */
export const makeWriteEffect = makeWriteEffectGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeExportEffect<import("./atom").Atom>}
 */
export const makeExportEffect = makeExportEffectGeneric;

////////////////
// Expression //
////////////////

/**
 * @type {typeof import("../lang/node.mjs").makePrimitiveExpression<import("./atom").Atom>}
 */
export const makePrimitiveExpression = makePrimitiveExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeImportExpression<import("./atom").Atom>}
 */
export const makeImportExpression = makeImportExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeIntrinsicExpression<import("./atom").Atom>}
 */
export const makeIntrinsicExpression = makeIntrinsicExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeReadExpression<import("./atom").Atom>}
 */
export const makeReadExpression = makeReadExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeClosureExpression<import("./atom").Atom>}
 */
export const makeClosureExpression = makeClosureExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeAwaitExpression<import("./atom").Atom>}
 */
export const makeAwaitExpression = makeAwaitExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeYieldExpression<import("./atom").Atom>}
 */
export const makeYieldExpression = makeYieldExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeSequenceExpression<import("./atom").Atom>}
 */
export const makeSequenceExpression = makeSequenceExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeConditionalExpression<import("./atom").Atom>}
 */
export const makeConditionalExpression = makeConditionalExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeEvalExpression<import("./atom").Atom>}
 */
export const makeEvalExpression = makeEvalExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeApplyExpression<import("./atom").Atom>}
 */
export const makeApplyExpression = makeApplyExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeConstructExpression<import("./atom").Atom>}
 */
export const makeConstructExpression = makeConstructExpressionGeneric;
