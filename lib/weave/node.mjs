import { EMPTY } from "../util/index.mjs";
import {
  makeProgram as makeProgramInner,
  makeControlBlock as makeControlBlockInner,
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
} from "../node.mjs";

/////////////
// Program //
/////////////

/**
 * @type {(
 *   kind: "module" | "script" | "eval",
 *   situ: "global" | "local.deep" | "local.root",
 *   head: import("../header").Header[],
 *   body: import("./atom").ResRoutineBlock,
 * ) => import("./atom").ResProgram}
 */
export const makeProgram = (kind, situ, head, body) =>
  makeProgramInner(kind, situ, head, body, EMPTY);

///////////
// Block //
///////////

/**
 * @type {(
 *  labels: import("./atom").Label[],
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang").Intrinsic,
 *  ][],
 *  body: import("./atom").ResStatement[],
 * ) => import("./atom").ResControlBlock}
 */
export const makeControlBlock = (labels, bindings, body) =>
  makeControlBlockInner(labels, bindings, body, EMPTY);

/**
 * @type {(
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang").Intrinsic,
 *  ][],
 *  head: null | import("./atom").ResEffect[],
 *  body: import("./atom").ResStatement[],
 *  tail: import("./atom").ResExpression,
 * ) => import("./atom").ResRoutineBlock}
 */
export const makeRoutineBlock = (bindings, head, body, tail) =>
  makeRoutineBlockInner(bindings, head, body, tail, EMPTY);

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: import("./atom").ResEffect,
 * ) => import("./atom").ResStatement}
 */
export const makeEffectStatement = (inner) =>
  makeEffectStatementInner(inner, EMPTY);

/**
 * @type {(
 * ) => import("./atom").ResStatement}
 */
export const makeDebuggerStatement = () => makeDebuggerStatementInner(EMPTY);

/**
 * @type {(
 *   label: import("./atom").Label,
 * ) => import("./atom").ResStatement}
 */
export const makeBreakStatement = (label) =>
  makeBreakStatementInner(label, EMPTY);

/**
 * @type {(
 *   body: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeBlockStatement = (body) =>
  makeBlockStatementInner(body, EMPTY);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   then_: import("./atom").ResControlBlock,
 *   else_: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeIfStatement = (test, then_, else_) =>
  makeIfStatementInner(test, then_, else_, EMPTY);

/**
 * @type {(
 *   try_: import("./atom").ResControlBlock,
 *   catch_: import("./atom").ResControlBlock,
 *   finally_: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeTryStatement = (try_, catch_, finally_) =>
  makeTryStatementInner(try_, catch_, finally_, EMPTY);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   body: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeWhileStatement = (test, body) =>
  makeWhileStatementInner(test, body, EMPTY);

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeExpressionEffect = (discard) =>
  makeExpressionEffectInner(discard, EMPTY);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   positive: import("./atom").ResEffect[],
 *   negative: import("./atom").ResEffect[],
 * ) => import("./atom").ResEffect}
 */
export const makeConditionalEffect = (test, positive, negative) =>
  makeConditionalEffectInner(test, positive, negative, EMPTY);

/**
 * @type {(
 *   variable: (
 *     | import("../lang").Parameter
 *     | import("./atom").ResVariable
 *   ),
 *   value: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeWriteEffect = (variable, value) =>
  makeWriteEffectInner(variable, value, EMPTY);

/**
 * @type {(
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   value: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeExportEffect = (specifier, value) =>
  makeExportEffectInner(specifier, value, EMPTY);

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: import("../lang").Primitive,
 * ) => import("./atom").ResExpression}
 */
export const makePrimitiveExpression = (primitive) =>
  makePrimitiveExpressionInner(primitive, EMPTY);

/**
 * @type {(
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * ) => import("./atom").ResExpression}
 */
export const makeImportExpression = (source, specifier) =>
  makeImportExpressionInner(source, specifier, EMPTY);

/**
 * @type {(
 *   intrinsic: import("../lang").Intrinsic,
 * ) => import("./atom").ResExpression}
 */
export const makeIntrinsicExpression = (intrinsic) =>
  makeIntrinsicExpressionInner(intrinsic, EMPTY);

/**
 * @type {(
 *   variable: (
 *     | import("../lang").Parameter
 *     | import("./atom").ResVariable
 *   ),
 * ) => import("./atom").ResExpression}
 */
export const makeReadExpression = (variable) =>
  makeReadExpressionInner(variable, EMPTY);

/**
 * @type {(
 *   kind: import("../lang").ClosureKind,
 *   asynchronous: boolean,
 *   body: import("./atom").ResRoutineBlock,
 * ) => import("./atom").ResExpression}
 */
export const makeClosureExpression = (kind, asynchronous, body) =>
  makeClosureExpressionInner(kind, asynchronous, body, EMPTY);

/**
 * @type {(
 *   promise: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeAwaitExpression = (promise) =>
  makeAwaitExpressionInner(promise, EMPTY);

/**
 * @type {(
 *   delegate: boolean,
 *   item: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeYieldExpression = (delegate, item) =>
  makeYieldExpressionInner(delegate, item, EMPTY);

/**
 * @type {(
 *   head: import("./atom").ResEffect[],
 *   tail: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeSequenceExpression = (head, tail) =>
  makeSequenceExpressionInner(head, tail, EMPTY);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   consequent: import("./atom").ResExpression,
 *   alternate: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeConditionalExpression = (test, consequent, alternate) =>
  makeConditionalExpressionInner(test, consequent, alternate, EMPTY);

/**
 * @type {(
 *   code: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeEvalExpression = (code) =>
  makeEvalExpressionInner(code, EMPTY);

/**
 * @type {(
 *   callee: import("./atom").ResExpression,
 *   this_: import("./atom").ResExpression,
 *   arguments_: import("./atom").ResExpression[],
 * ) => import("./atom").ResExpression}
 */
export const makeApplyExpression = (callee, this_, arguments_) =>
  makeApplyExpressionInner(callee, this_, arguments_, EMPTY);

/**
 * @type {(
 *   callee: import("./atom").ResExpression,
 *   arguments_: import("./atom").ResExpression[],
 * ) => import("./atom").ResExpression}
 */
export const makeConstructExpression = (callee, arguments_) =>
  makeConstructExpressionInner(callee, arguments_, EMPTY);
