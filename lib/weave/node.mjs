import {
  makeProgram as makeProgramInner,
  makeSegmentBlock as makeSegmentBlockInner,
  makeRoutineBlock as makeRoutineBlockInner,
  makeEffectStatement as makeEffectStatementInner,
  makeDebuggerStatement as makeDebuggerStatementInner,
  makeBreakStatement as makeBreakStatementInner,
  makeBlockStatement as makeBlockStatementInner,
  makeIfStatement as makeIfStatementInner,
  makeTryStatement as makeTryStatementInner,
  makeWhileStatement as makeWhileStatementInner,
  makeExpressionEffect as makeExpressionEffectInner,
  makeConditionalEffect as makeConditionalEffectInner,
  makeWriteEffect as makeWriteEffectInner,
  makeExportEffect as makeExportEffectInner,
  makePrimitiveExpression as makePrimitiveExpressionInner,
  makeImportExpression as makeImportExpressionInner,
  makeIntrinsicExpression as makeIntrinsicExpressionInner,
  makeReadExpression as makeReadExpressionInner,
  makeClosureExpression as makeClosureExpressionInner,
  makeAwaitExpression as makeAwaitExpressionInner,
  makeYieldExpression as makeYieldExpressionInner,
  makeSequenceExpression as makeSequenceExpressionInner,
  makeConditionalExpression as makeConditionalExpressionInner,
  makeEvalExpression as makeEvalExpressionInner,
  makeApplyExpression as makeApplyExpressionInner,
  makeConstructExpression as makeConstructExpressionInner,
} from "../lang/index.mjs";

/////////////
// Program //
/////////////

/**
 * @type {typeof import("../lang/node.mjs").makeProgram<import("./atom.d.ts").ResAtom>}
 */
export const makeProgram = makeProgramInner;

///////////
// Block //
///////////

/**
 * @type {typeof import("../lang/node.mjs").makeSegmentBlock<import("./atom.d.ts").ResAtom>}
 */
export const makeSegmentBlock = makeSegmentBlockInner;

/**
 * @type {typeof import("../lang/node.mjs").makeRoutineBlock<import("./atom.d.ts").ResAtom>}
 */
export const makeRoutineBlock = makeRoutineBlockInner;

///////////////
// Statement //
///////////////

/**
 * @type {typeof import("../lang/node.mjs").makeEffectStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeEffectStatement = makeEffectStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeDebuggerStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeDebuggerStatement = makeDebuggerStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeBreakStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeBreakStatement = makeBreakStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeBlockStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeBlockStatement = makeBlockStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeIfStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeIfStatement = makeIfStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeTryStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeTryStatement = makeTryStatementInner;

/**
 * @type {typeof import("../lang/node.mjs").makeWhileStatement<import("./atom.d.ts").ResAtom>}
 */
export const makeWhileStatement = makeWhileStatementInner;

////////////
// Effect //
////////////

/**
 * @type {typeof import("../lang/node.mjs").makeExpressionEffect<import("./atom.d.ts").ResAtom>}
 */
export const makeExpressionEffect = makeExpressionEffectInner;

/**
 * @type {typeof import("../lang/node.mjs").makeConditionalEffect<import("./atom.d.ts").ResAtom>}
 */
export const makeConditionalEffect = makeConditionalEffectInner;

/**
 * @type {typeof import("../lang/node.mjs").makeWriteEffect<import("./atom.d.ts").ResAtom>}
 */
export const makeWriteEffect = makeWriteEffectInner;

/**
 * @type {typeof import("../lang/node.mjs").makeExportEffect<import("./atom.d.ts").ResAtom>}
 */
export const makeExportEffect = makeExportEffectInner;

////////////////
// Expression //
////////////////

/**
 * @type {typeof import("../lang/node.mjs").makePrimitiveExpression<import("./atom.d.ts").ResAtom>}
 */
export const makePrimitiveExpression = makePrimitiveExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeImportExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeImportExpression = makeImportExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeIntrinsicExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeIntrinsicExpression = makeIntrinsicExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeReadExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeReadExpression = makeReadExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeClosureExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeClosureExpression = makeClosureExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeAwaitExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeAwaitExpression = makeAwaitExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeYieldExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeYieldExpression = makeYieldExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeSequenceExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeSequenceExpression = makeSequenceExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeConditionalExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeConditionalExpression = makeConditionalExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeEvalExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeEvalExpression = makeEvalExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeApplyExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeApplyExpression = makeApplyExpressionInner;

/**
 * @type {typeof import("../lang/node.mjs").makeConstructExpression<import("./atom.d.ts").ResAtom>}
 */
export const makeConstructExpression = makeConstructExpressionInner;
