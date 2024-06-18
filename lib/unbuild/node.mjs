// This unfortunate file is necessary because ts shokes too much when node
// builders are generic.

import {
  makeProgram as makeProgramGeneric,
  makeControlBlock as makeControlBlockGeneric,
  makeRoutineBlock as makeRoutineBlockGeneric,
  makePreludeBlock as makePreludeBlockGeneric,
  makeEffectStatement as makeEffectStatementGeneric,
  makeReturnStatement as makeReturnStatementGeneric,
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
  makeArrowExpression as makeArrowExpressionGeneric,
  makeFunctionExpression as makeFunctionExpressionGeneric,
  makeGeneratorExpression as makeGeneratorExpressionGeneric,
  makeClosureExpression as makeClosureExpressionGeneric,
  makeAwaitExpression as makeAwaitExpressionGeneric,
  makeYieldExpression as makeYieldExpressionGeneric,
  makeSequenceExpression as makeSequenceExpressionGeneric,
  makeConditionalExpression as makeConditionalExpressionGeneric,
  makeEvalExpression as makeEvalExpressionGeneric,
  makeApplyExpression as makeApplyExpressionGeneric,
  makeConstructExpression as makeConstructExpressionGeneric,
} from "../node.mjs";
import { map } from "../util/index.mjs";

/////////////
// Program //
/////////////

/**
 * @type {typeof import("../node.mjs").makeProgram<import("./atom").Atom>}
 */
export const makeProgram = makeProgramGeneric;

/**
 * @type {typeof import("../node.mjs").makeControlBlock<import("./atom").Atom>}
 */
export const makeControlBlock = makeControlBlockGeneric;

/**
 * @type {typeof import("../node.mjs").makeRoutineBlock<import("./atom").Atom>}
 */
export const makeRoutineBlock = makeRoutineBlockGeneric;

/**
 * @type {typeof import("../node.mjs").makePreludeBlock<import("./atom").Atom>}
 */
export const makPreludeBlock = makePreludeBlockGeneric;

/**
 * @type {typeof import("../node.mjs").makeEffectStatement<import("./atom").Atom>}
 */
export const makeEffectStatement = makeEffectStatementGeneric;

/**
 * @type {(
 *   nodes: import("./atom").Effect[],
 *   tag: import("../path").Path
 * ) => import("./atom").Statement[]}
 */
export const listEffectStatement = (nodes, tag) =>
  map(nodes, (node) => makeEffectStatement(node, tag));

/**
 * @type {typeof import("../node.mjs").makeReturnStatement<import("./atom").Atom>}
 */
export const makeReturnStatement = makeReturnStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeDebuggerStatement<import("./atom").Atom>}
 */
export const makeDebuggerStatement = makeDebuggerStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeBreakStatement<import("./atom").Atom>}
 */
export const makeBreakStatement = makeBreakStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeBlockStatement<import("./atom").Atom>}
 */
export const makeBlockStatement = makeBlockStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeIfStatement<import("./atom").Atom>}
 */
export const makeIfStatement = makeIfStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeTryStatement<import("./atom").Atom>}
 */
export const makeTryStatement = makeTryStatementGeneric;

/**
 * @type {typeof import("../node.mjs").makeWhileStatement<import("./atom").Atom>}
 */

export const makeWhileStatement = makeWhileStatementGeneric;

////////////
// Effect //
////////////

/**
 * @type {typeof import("../node.mjs").makeExpressionEffect<import("./atom").Atom>}
 */
export const makeExpressionEffect = makeExpressionEffectGeneric;

/**
 * @type {typeof import("../node.mjs").makeConditionalEffect<import("./atom").Atom>}
 */
export const makeConditionalEffect = makeConditionalEffectGeneric;

/**
 * @type {typeof import("../node.mjs").makeWriteEffect<import("./atom").Atom>}
 */
export const makeWriteEffect = makeWriteEffectGeneric;

/**
 * @type {typeof import("../node.mjs").makeExportEffect<import("./atom").Atom>}
 */
export const makeExportEffect = makeExportEffectGeneric;

////////////////
// Expression //
////////////////

/**
 * @type {typeof import("../node.mjs").makePrimitiveExpression<import("./atom").Atom>}
 */
export const makePrimitiveExpression = makePrimitiveExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeImportExpression<import("./atom").Atom>}
 */
export const makeImportExpression = makeImportExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeIntrinsicExpression<import("./atom").Atom>}
 */
export const makeIntrinsicExpression = makeIntrinsicExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeReadExpression<import("./atom").Atom>}
 */
export const makeReadExpression = makeReadExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeArrowExpression<import("./atom").Atom>}
 */
export const makeArrowExpression = makeArrowExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeFunctionExpression<import("./atom").Atom>}
 */
export const makeFunctionExpression = makeFunctionExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeGeneratorExpression<import("./atom").Atom>}
 */
export const makeGeneratorExpression = makeGeneratorExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeClosureExpression<import("./atom").Atom>}
 */
export const makeClosureExpression = makeClosureExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeAwaitExpression<import("./atom").Atom>}
 */
export const makeAwaitExpression = makeAwaitExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeYieldExpression<import("./atom").Atom>}
 */
export const makeYieldExpression = makeYieldExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeSequenceExpression<import("./atom").Atom>}
 */
export const makeSequenceExpression = makeSequenceExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeConditionalExpression<import("./atom").Atom>}
 */
export const makeConditionalExpression = makeConditionalExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeEvalExpression<import("./atom").Atom>}
 */
export const makeEvalExpression = makeEvalExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeApplyExpression<import("./atom").Atom>}
 */
export const makeApplyExpression = makeApplyExpressionGeneric;

/**
 * @type {typeof import("../node.mjs").makeConstructExpression<import("./atom").Atom>}
 */
export const makeConstructExpression = makeConstructExpressionGeneric;
