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
 * @type {typeof import("../lang/node.mjs").makeProgram<import("./atom.d.ts").Atom>}
 */
export const makeProgram = makeProgramGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeSegmentBlock<import("./atom.d.ts").Atom>}
 */
export const makeSegmentBlock = makeSegmentBlockGeneric;

/**
 * @type {(
 *   labels: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Label>,
 *   bindings: [import("./variable.d.ts").Variable, import("../lang/syntax.d.ts").Intrinsic][],
 *   body: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Statement>,
 *   tag: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").TreeSegmentBlock}
 */
export const makeTreeSegmentBlock = (labels, bindings, body, tag) => ({
  type: "SegmentBlock",
  labels,
  bindings,
  body,
  tag,
});

/**
 * @type {typeof import("../lang/node.mjs").makeRoutineBlock<import("./atom.d.ts").Atom>}
 */
export const makeRoutineBlock = makeRoutineBlockGeneric;

/**
 * @type {(
 *   bindings: [import("./variable.d.ts").Variable, import("../lang/syntax.d.ts").Intrinsic][],
 *   head: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 *   body: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Statement>,
 *   tail: import("./atom.d.ts").Expression,
 *   tag: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").TreeRoutineBlock}
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
 * @type {typeof import("../lang/node.mjs").makeEffectStatement<import("./atom.d.ts").Atom>}
 */
export const makeEffectStatement = makeEffectStatementGeneric;

/**
 * @type {(
 *   nodes: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 *   tag: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").Statement[]}
 */
export const listEffectStatement = (nodes, tag) =>
  mapTree(nodes, (node) => makeEffectStatement(node, tag));

/**
 * @type {typeof import("../lang/node.mjs").makeDebuggerStatement<import("./atom.d.ts").Atom>}
 */
export const makeDebuggerStatement = makeDebuggerStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeBreakStatement<import("./atom.d.ts").Atom>}
 */
export const makeBreakStatement = makeBreakStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeBlockStatement<import("./atom.d.ts").Atom>}
 */
export const makeBlockStatement = makeBlockStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeIfStatement<import("./atom.d.ts").Atom>}
 */
export const makeIfStatement = makeIfStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeTryStatement<import("./atom.d.ts").Atom>}
 */
export const makeTryStatement = makeTryStatementGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeWhileStatement<import("./atom.d.ts").Atom>}
 */

export const makeWhileStatement = makeWhileStatementGeneric;

////////////
// Effect //
////////////

/**
 * @type {typeof import("../lang/node.mjs").makeExpressionEffect<import("./atom.d.ts").Atom>}
 */
export const makeExpressionEffect = makeExpressionEffectGeneric;

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>}
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
 * @type {typeof import("../lang/node.mjs").makeConditionalEffect<import("./atom.d.ts").Atom>}
 */
export const makeConditionalEffect = makeConditionalEffectGeneric;

/**
 * @type {(
 *   test: import("./atom.d.ts").Expression,
 *   consequent: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 *   alternate: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").Effect}
 */
export const makeTreeConditionalEffect = (test, consequent, alternate, hash) =>
  makeConditionalEffect(
    test,
    flatenTree(consequent),
    flatenTree(alternate),
    hash,
  );

/**
 * @type {typeof import("../lang/node.mjs").makeWriteEffect<import("./atom.d.ts").Atom>}
 */
export const makeWriteEffect = makeWriteEffectGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeExportEffect<import("./atom.d.ts").Atom>}
 */
export const makeExportEffect = makeExportEffectGeneric;

////////////////
// Expression //
////////////////

/**
 * @type {typeof import("../lang/node.mjs").makePrimitiveExpression<import("./atom.d.ts").Atom>}
 */
export const makePrimitiveExpression = makePrimitiveExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeImportExpression<import("./atom.d.ts").Atom>}
 */
export const makeImportExpression = makeImportExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeIntrinsicExpression<import("./atom.d.ts").Atom>}
 */
export const makeIntrinsicExpression = makeIntrinsicExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeReadExpression<import("./atom.d.ts").Atom>}
 */
export const makeReadExpression = makeReadExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeClosureExpression<import("./atom.d.ts").Atom>}
 */
export const makeClosureExpression = makeClosureExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeAwaitExpression<import("./atom.d.ts").Atom>}
 */
export const makeAwaitExpression = makeAwaitExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeYieldExpression<import("./atom.d.ts").Atom>}
 */
export const makeYieldExpression = makeYieldExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeSequenceExpression<import("./atom.d.ts").Atom>}
 */
export const makeSequenceExpression = makeSequenceExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeConditionalExpression<import("./atom.d.ts").Atom>}
 */
export const makeConditionalExpression = makeConditionalExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeEvalExpression<import("./atom.d.ts").Atom>}
 */
export const makeEvalExpression = makeEvalExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeApplyExpression<import("./atom.d.ts").Atom>}
 */
export const makeApplyExpression = makeApplyExpressionGeneric;

/**
 * @type {typeof import("../lang/node.mjs").makeConstructExpression<import("./atom.d.ts").Atom>}
 */
export const makeConstructExpression = makeConstructExpressionGeneric;
