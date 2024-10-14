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
 * @type {(
 *   kind: "module" | "script" | "eval",
 *   situ: "global" | "local.deep" | "local.root",
 *   head: import("../lang/header").Header[],
 *   body: import("./atom").ResRoutineBlock,
 * ) => import("./atom").ResProgram}
 */
export const makeProgram = (kind, situ, head, body) =>
  makeProgramInner(kind, situ, head, body, null);

///////////
// Block //
///////////

/**
 * @type {(
 *  labels: import("./atom").Label[],
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang/syntax").Intrinsic,
 *  ][],
 *  body: import("./atom").ResStatement[],
 * ) => import("./atom").ResSegmentBlock}
 */
export const makeSegmentBlock = (labels, bindings, body) =>
  makeSegmentBlockInner(labels, bindings, body, null);

/**
 * @type {(
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang/syntax").Intrinsic,
 *  ][],
 *  head: null | import("./atom").ResEffect[],
 *  body: import("./atom").ResStatement[],
 *  tail: import("./atom").ResExpression,
 * ) => import("./atom").ResRoutineBlock}
 */
export const makeRoutineBlock = (bindings, head, body, tail) =>
  makeRoutineBlockInner(bindings, head, body, tail, null);

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: import("./atom").ResEffect,
 * ) => import("./atom").ResStatement}
 */
export const makeEffectStatement = (inner) =>
  makeEffectStatementInner(inner, null);

/**
 * @type {(
 * ) => import("./atom").ResStatement}
 */
export const makeDebuggerStatement = () => makeDebuggerStatementInner(null);

/**
 * @type {(
 *   label: import("./atom").Label,
 * ) => import("./atom").ResStatement}
 */
export const makeBreakStatement = (label) =>
  makeBreakStatementInner(label, null);

/**
 * @type {(
 *   body: import("./atom").ResSegmentBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeBlockStatement = (body) => makeBlockStatementInner(body, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   then_: import("./atom").ResSegmentBlock,
 *   else_: import("./atom").ResSegmentBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeIfStatement = (test, then_, else_) =>
  makeIfStatementInner(test, then_, else_, null);

/**
 * @type {(
 *   try_: import("./atom").ResSegmentBlock,
 *   catch_: import("./atom").ResSegmentBlock,
 *   finally_: import("./atom").ResSegmentBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeTryStatement = (try_, catch_, finally_) =>
  makeTryStatementInner(try_, catch_, finally_, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   body: import("./atom").ResSegmentBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeWhileStatement = (test, body) =>
  makeWhileStatementInner(test, body, null);

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeExpressionEffect = (discard) =>
  makeExpressionEffectInner(discard, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   positive: import("./atom").ResEffect[],
 *   negative: import("./atom").ResEffect[],
 * ) => import("./atom").ResEffect}
 */
export const makeConditionalEffect = (test, positive, negative) =>
  makeConditionalEffectInner(test, positive, negative, null);

/**
 * @type {(
 *   variable: (
 *     | import("../lang/syntax").Parameter
 *     | import("./atom").ResVariable
 *   ),
 *   value: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeWriteEffect = (variable, value) =>
  makeWriteEffectInner(variable, value, null);

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
  makeExportEffectInner(specifier, value, null);

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: import("../lang/syntax").Primitive,
 * ) => import("./atom").ResExpression}
 */
export const makePrimitiveExpression = (primitive) =>
  makePrimitiveExpressionInner(primitive, null);

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
  makeImportExpressionInner(source, specifier, null);

/**
 * @type {(
 *   intrinsic: import("../lang/syntax").Intrinsic,
 * ) => import("./atom").ResExpression}
 */
export const makeIntrinsicExpression = (intrinsic) =>
  makeIntrinsicExpressionInner(intrinsic, null);

/**
 * @type {(
 *   variable: (
 *     | import("../lang/syntax").Parameter
 *     | import("./atom").ResVariable
 *   ),
 * ) => import("./atom").ResExpression}
 */
export const makeReadExpression = (variable) =>
  makeReadExpressionInner(variable, null);

/**
 * @type {(
 *   kind: import("../lang/syntax").ClosureKind,
 *   asynchronous: boolean,
 *   body: import("./atom").ResRoutineBlock,
 * ) => import("./atom").ResExpression}
 */
export const makeClosureExpression = (kind, asynchronous, body) =>
  makeClosureExpressionInner(kind, asynchronous, body, null);

/**
 * @type {(
 *   promise: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeAwaitExpression = (promise) =>
  makeAwaitExpressionInner(promise, null);

/**
 * @type {(
 *   delegate: boolean,
 *   item: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeYieldExpression = (delegate, item) =>
  makeYieldExpressionInner(delegate, item, null);

/**
 * @type {(
 *   head: import("./atom").ResEffect[],
 *   tail: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeSequenceExpression = (head, tail) =>
  makeSequenceExpressionInner(head, tail, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   consequent: import("./atom").ResExpression,
 *   alternate: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeConditionalExpression = (test, consequent, alternate) =>
  makeConditionalExpressionInner(test, consequent, alternate, null);

/**
 * @type {(
 *   code: import("./atom").ResExpression,
 * ) => import("./atom").ResExpression}
 */
export const makeEvalExpression = (code) => makeEvalExpressionInner(code, null);

/**
 * @type {(
 *   callee: import("./atom").ResExpression,
 *   this_: import("./atom").ResExpression,
 *   arguments_: import("./atom").ResExpression[],
 * ) => import("./atom").ResExpression}
 */
export const makeApplyExpression = (callee, this_, arguments_) =>
  makeApplyExpressionInner(callee, this_, arguments_, null);

/**
 * @type {(
 *   callee: import("./atom").ResExpression,
 *   arguments_: import("./atom").ResExpression[],
 * ) => import("./atom").ResExpression}
 */
export const makeConstructExpression = (callee, arguments_) =>
  makeConstructExpressionInner(callee, arguments_, null);
