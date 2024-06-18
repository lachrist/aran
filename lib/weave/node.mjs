import {
  makeProgram as makeProgramInner,
  makeControlBlock as makeControlBlockInner,
  makePreludeBlock as makePreludeBlockInner,
  makeRoutineBlock as makeRoutineBlockInner,
  makeEffectStatement as makeEffectStatementInner,
  makeReturnStatement as makeReturnStatementInner,
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
  makeArrowExpression as makeArrowExpressionInner,
  makeFunctionExpression as makeFunctionExpressionInner,
  makeGeneratorExpression as makeGeneratorExpressionInner,
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
  makeProgramInner(kind, situ, head, body, null);

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
  makeControlBlockInner(labels, bindings, body, null);

/**
 * @type {(
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang").Intrinsic,
 *  ][],
 *  body: import("./atom").ResStatement[],
 *  tail: import("./atom").ResExpression,
 * ) => import("./atom").ResRoutineBlock}
 */
export const makeRoutineBlock = (bindings, body, tail) =>
  makeRoutineBlockInner(bindings, body, tail, null);

/**
 * @type {(
 *  bindings: [
 *    import("./atom").ResVariable,
 *    import("../lang").Intrinsic,
 *  ][],
 *  head: import("./atom").ResEffect[],
 *  body: import("./atom").ResStatement[],
 *  tail: import("./atom").ResExpression,
 * ) => import("./atom").ResPreludeBlock}
 */
export const makePreludeBlock = (bindings, head, body, tail) =>
  makePreludeBlockInner(bindings, head, body, tail, null);

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
 *   result: import("./atom").ResExpression,
 * ) => import("./atom").ResStatement}
 */
export const makeReturnStatement = (result) =>
  makeReturnStatementInner(result, null);

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
 *   body: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeBlockStatement = (body) => makeBlockStatementInner(body, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   then_: import("./atom").ResControlBlock,
 *   else_: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeIfStatement = (test, then_, else_) =>
  makeIfStatementInner(test, then_, else_, null);

/**
 * @type {(
 *   try_: import("./atom").ResControlBlock,
 *   catch_: import("./atom").ResControlBlock,
 *   finally_: import("./atom").ResControlBlock,
 * ) => import("./atom").ResStatement}
 */
export const makeTryStatement = (try_, catch_, finally_) =>
  makeTryStatementInner(try_, catch_, finally_, null);

/**
 * @type {(
 *   test: import("./atom").ResExpression,
 *   body: import("./atom").ResControlBlock,
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
 *     | import("../lang").Parameter
 *     | import("./atom").ResVariable
 *   ),
 *   value: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeWriteEffect = (variable, value) =>
  makeWriteEffectInner(variable, value, null);

/**
 * @type {(
 *   export_: import("../estree").Specifier,
 *   value: import("./atom").ResExpression,
 * ) => import("./atom").ResEffect}
 */
export const makeExportEffect = (export_, value) =>
  makeExportEffectInner(export_, value, null);

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: import("../lang").Primitive,
 * ) => import("./atom").ResExpression}
 */
export const makePrimitiveExpression = (primitive) =>
  makePrimitiveExpressionInner(primitive, null);

/**
 * @type {(
 *   source: import("../estree").Source,
 *   import_: import("../estree").Specifier | null,
 * ) => import("./atom").ResExpression}
 */
export const makeImportExpression = (source, import_) =>
  makeImportExpressionInner(source, import_, null);

/**
 * @type {(
 *   intrinsic: import("../lang").Intrinsic,
 * ) => import("./atom").ResExpression}
 */
export const makeIntrinsicExpression = (intrinsic) =>
  makeIntrinsicExpressionInner(intrinsic, null);

/**
 * @type {(
 *   variable: (
 *     | import("../lang").Parameter
 *     | import("./atom").ResVariable
 *   ),
 * ) => import("./atom").ResExpression}
 */
export const makeReadExpression = (variable) =>
  makeReadExpressionInner(variable, null);

/**
 * @type {(
 *   asynchronous: boolean,
 *   body: import("./atom").ResRoutineBlock
 * ) => import("./atom").ResExpression}
 */
export const makeArrowExpression = (asynchronous, body) =>
  makeArrowExpressionInner(asynchronous, body, null);

/**
 * @type {(
 *   asynchronous: boolean,
 *   body: import("./atom").ResRoutineBlock
 * ) => import("./atom").ResExpression}
 */
export const makeFunctionExpression = (asynchronous, body) =>
  makeFunctionExpressionInner(asynchronous, body, null);

/**
 * @type {(
 *   asynchronous: boolean,
 *   body: import("./atom").ResPreludeBlock
 * ) => import("./atom").ResExpression}
 */
export const makeGeneratorExpression = (asynchronous, body) =>
  makeGeneratorExpressionInner(asynchronous, body, null);

/**
 * @type {(
 *   kind: "generator" | "arrow" | "function",
 *   asynchronous: boolean,
 *   body: (
 *     | import("./atom").ResRoutineBlock
 *     | import("./atom").ResPreludeBlock
 *   ),
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
