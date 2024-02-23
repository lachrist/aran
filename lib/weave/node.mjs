import {
  filterOut,
  includes,
  map,
  compileGet,
  reduceEntry,
  listEntry,
  flatMap,
} from "../util/index.mjs";

const getTag = compileGet("tag");

/** @type {(node: aran.Node<weave.ResAtom>) => weave.Free} */
export const recordFree = getTag;

///////////
// Block //
///////////

/**
 * @type {(
 *   variables: weave.ResVariable[],
 *   statements: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
export const makeClosureBlock = (variables, statements, completion) => ({
  type: "ClosureBlock",
  frame: variables,
  body: statements,
  completion,
  tag: reduceEntry(
    filterOut(
      [
        ...flatMap(map(statements, getTag), listEntry),
        ...listEntry(completion.tag),
      ],
      ([key, _val]) => includes(variables, key),
    ),
  ),
});

/**
 * @type {(
 *   labels: weave.Label[],
 *   variables: weave.ResVariable[],
 *   statements: aran.Statement<weave.ResAtom>[],
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
export const makeControlBlock = (labels, variables, statements) => ({
  type: "ControlBlock",
  labels,
  frame: variables,
  body: statements,
  tag: reduceEntry(
    filterOut(flatMap(map(statements, getTag), listEntry), ([key, _val]) =>
      includes(variables, key),
    ),
  ),
});

/////////////
// Program //
/////////////

/**
 * @type {(
 *   sort: import("../sort").Sort,
 *   head: import("../header").Header[],
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const makeProgram = (sort, head, body) => ({
  type: "Program",
  sort,
  head,
  body,
  tag: body.tag,
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: inner.tag,
});

/**
 * @type {(
 *   result: aran.Expression<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: result.tag,
});

/** @type {() => aran.Statement<weave.ResAtom>} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: {},
});

/** @type {(label: weave.Label) => aran.Statement<weave.ResAtom>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: {},
});

/**
 * @type {(
 *   naked: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeBlockStatement = (do_) => ({
  type: "BlockStatement",
  body: do_,
  tag: do_.tag,
});

/**
 * @type {(
 *   if_: aran.Expression<weave.ResAtom>,
 *   then_: aran.ControlBlock<weave.ResAtom>,
 *   else_: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeIfStatement = (if_, then_, else_) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: { ...if_.tag, ...then_.tag, ...else_.tag },
});

/**
 * @type {(
 *   try_: aran.ControlBlock<weave.ResAtom>,
 *   catch_: aran.ControlBlock<weave.ResAtom>,
 *   finally_: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: { ...try_.tag, ...catch_.tag, ...finally_.tag },
});

/**
 * @type {(
 *   while_: aran.Expression<weave.ResAtom>,
 *   loop: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeWhileStatement = (while_, do_) => ({
  type: "WhileStatement",
  while: while_,
  body: do_,
  tag: { ...while_.tag, ...do_.tag },
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: discard.tag,
});

/**
 * @type {(
 *   conditional: aran.Expression<weave.ResAtom>,
 *   positive: aran.Effect<weave.ResAtom>[],
 *   negative: aran.Effect<weave.ResAtom>[],
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeConditionalEffect = (condition, positive, negative) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: reduceEntry([
    ...listEntry(condition.tag),
    ...flatMap(map(positive, getTag), listEntry),
    ...flatMap(map(negative, getTag), listEntry),
  ]),
});

/**
 * @type {(
 *   ... rest:
 *     | [aran.Parameter, aran.Expression<weave.ResAtom>, null]
 *     | [weave.ResVariable, aran.Expression<weave.ResAtom>, weave.Binding]
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteEffect = (variable, right, binding) => ({
  type: "WriteEffect",
  variable,
  value: right,
  tag: binding === null ? right.tag : { ...right.tag, [variable]: binding },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeExportEffect = (export_, right) => ({
  type: "ExportEffect",
  export: export_,
  value: right,
  tag: right.tag,
});

////////////////
// Expression //
////////////////

/** @type {(primitive: aran.Primitive) => aran.Expression<weave.ResAtom>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: {},
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: {},
});

/** @type {(intrinsic: aran.Intrinsic) => aran.Expression<weave.ResAtom>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: {},
});

/**
 * @type {(
 *   ... rest:
 *     | [aran.Parameter, null]
 *     | [weave.ResVariable, weave.Binding]
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadExpression = (variable, binding) => ({
  type: "ReadExpression",
  variable,
  tag: binding === null ? {} : { [variable]: binding },
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeFunctionExpression = (asynchronous, generator, body) => ({
  type: "FunctionExpression",
  asynchronous,
  generator,
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeArrowExpression = (asynchronous, body) => ({
  type: "ArrowExpression",
  asynchronous,
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   promise: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: promise.tag,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: item.tag,
});

/**
 * @type {(
 *   head: aran.Effect<weave.ResAtom>[],
 *   tail: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: reduceEntry([
    ...flatMap(map(head, getTag), listEntry),
    ...listEntry(tail.tag),
  ]),
});

/**
 * @type {(
 *   condition: aran.Expression<weave.ResAtom>,
 *   consequent: aran.Expression<weave.ResAtom>,
 *   alternate: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag: { ...condition.tag, ...consequent.tag, ...alternate.tag },
});

/**
 * @type {(
 *   code: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
  tag: code.tag,
});

/**
 * @type {(
 *   callee: aran.Expression<weave.ResAtom>,
 *   this_: aran.Expression<weave.ResAtom>,
 *   arguments_: aran.Expression<weave.ResAtom>[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: reduceEntry([
    ...listEntry(callee.tag),
    ...listEntry(this_.tag),
    ...flatMap(map(arguments_, getTag), listEntry),
  ]),
});

/**
 * @type {(
 *   callee: aran.Expression<weave.ResAtom>,
 *   arguments_: aran.Expression<weave.ResAtom>[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: reduceEntry([
    ...listEntry(callee.tag),
    ...flatMap(map(arguments_, getTag), listEntry),
  ]),
});
