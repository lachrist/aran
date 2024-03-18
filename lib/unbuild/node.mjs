// The logic of this file generic and not bound to unbuild pass.
// Unfortunally, <A extends aran.Atom> type parameter does confuses
// ts when the result of these constrcutors is passed to an argument
// that is itself a type parameter.

/////////////
// Program //
/////////////

import { AranError } from "../error.mjs";
import { map } from "../util/index.mjs";

/**
 * @type {(
 *   sort: import("../sort").Sort,
 *   head: import("../header").Header[],
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeProgram = (sort, head, body, tag) => ({
  type: "Program",
  sort,
  head,
  body,
  tag,
});

///////////
// Block //
///////////

/* eslint-disable local/no-impure */
/**
 * @type {<V>(
 *   bindings: [V, aran.Isolate][],
 * ) => [V, aran.Isolate][]}
 */
const reportDuplicateVariable = (bindings) => {
  const { length } = bindings;
  for (let index1 = 0; index1 < length; index1 += 1) {
    const variable = bindings[index1][0];
    for (let index2 = index1 + 1; index2 < length; index2 += 1) {
      if (variable === bindings[index2][0]) {
        throw new AranError("duplicate variable", { variable, bindings });
      }
    }
  }
  return bindings;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *  labels: unbuild.Label[],
 *  frame: [import("./variable").Variable, aran.Isolate][],
 *  body: aran.Statement<unbuild.Atom>[],
 *  tag: import("./path").Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const makeControlBlock = (labels, frame, body, tag) => ({
  type: "ControlBlock",
  labels,
  frame: reportDuplicateVariable(frame),
  body,
  tag,
});

/**
 * @type {(
 *  frame: [import("./variable").Variable, aran.Isolate][],
 *  body: aran.Statement<unbuild.Atom>[],
 *  completion: aran.Expression<unbuild.Atom>,
 *  tag: import("./path").Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeClosureBlock = (frame, body, completion, tag) => ({
  type: "ClosureBlock",
  frame: reportDuplicateVariable(frame),
  body,
  completion,
  tag,
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {(
 *   inners: aran.Effect<unbuild.Atom>[],
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEffectStatement = (inners, tag) =>
  map(inners, (inner) => makeEffectStatement(inner, tag));

/**
 * @type {(
 *   result: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/**
 * @type {(
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/**
 * @type {(
 *   label: unbuild.Label,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/**
 * @type {(
 *   body: aran.ControlBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBlockStatement = (body, tag) => ({
  type: "BlockStatement",
  body,
  tag,
});

/**
 * @type {(
 *   test: aran.Expression<unbuild.Atom>,
 *   then_: aran.ControlBlock<unbuild.Atom>,
 *   else_: aran.ControlBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeIfStatement = (test, then_, else_, tag) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {(
 *   try_: aran.ControlBlock<unbuild.Atom>,
 *   catch_: aran.ControlBlock<unbuild.Atom>,
 *   finally_: aran.ControlBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {(
 *   test: aran.Expression<unbuild.Atom>,
 *   body: aran.ControlBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeWhileStatement = (test, body, tag) => ({
  type: "WhileStatement",
  test,
  body,
  tag,
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {(
 *   test: aran.Expression<unbuild.Atom>,
 *   positive: aran.Effect<unbuild.Atom>[],
 *   negative: aran.Effect<unbuild.Atom>[],
 *   tag: import("./path").Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeConditionalEffect = (test, positive, negative, tag) => ({
  type: "ConditionalEffect",
  test,
  positive,
  negative,
  tag,
});

/**
 * @type {(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteEffect = (variable, value, tag) => ({
  type: "WriteEffect",
  variable,
  value,
  tag,
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExportEffect = (export_, value, tag) => ({
  type: "ExportEffect",
  export: export_,
  value,
  tag,
});

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/**
 * @type {(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFunctionExpression = (asynchronous, generator, body, tag) => ({
  type: "FunctionExpression",
  asynchronous,
  generator,
  body,
  tag,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: false,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrowExpression = (asynchronous, _generator, body, tag) => ({
  type: "ArrowExpression",
  asynchronous,
  body,
  tag,
});

/**
 * @type {(
 *   promise: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>[],
 *   tail: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSequenceExpression = (head, tail, tag) => {
  if (head.length === 0) {
    return tail;
  } else if (tail.type === "SequenceExpression") {
    return {
      type: "SequenceExpression",
      head: [...head, ...tail.head],
      tail: tail.tail,
      tag,
    };
  } else {
    return {
      type: "SequenceExpression",
      head,
      tail,
      tag,
    };
  }
};

/**
 * @type {(
 *   test: aran.Expression<unbuild.Atom>,
 *   consequent: aran.Expression<unbuild.Atom>,
 *   alternate: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConditionalExpression = (
  test,
  consequent,
  alternate,
  tag,
) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
  tag,
});

/**
 * @type {(
 *   code: aran.Expression<unbuild.Atom>,
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   tag: import("./path").Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
