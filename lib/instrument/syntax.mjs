import { filter, includes, reduce } from "../util/index.mjs";

const {
  Object: { fromEntries: reduceEntry, entries: listEntry },
} = globalThis;

/**
 * @template X
 * @typedef {Record<string, X>} Tag<X>
 */

/** @type {<X>(tag: Tag<X>, node: Node<Tag<X>>) => Tag<X>} */
const combineTag = (tag, node) => ({ ...tag, ...node.tag });

/** @type {<X>(scope: Tag<X>, variables: string[]) => Tag<X>} */
const bindTag = (tag, variables) =>
  reduceEntry(
    filter(
      listEntry(tag),
      ([variable, _binding]) => !includes(variables, variable),
    ),
  );

/////////////
// Program //
/////////////

/**
 * @type {<X>(
 *   kind: ProgramKind,
 *   links: Link[],
 *   variables: string[],
 *   body: Statement<Tag<X>>[],
 *   completion: Expression<Tag<X>>,
 * ) => Program<Tag<X>>}
 */
// @ts-ignore
export const makeProgram = (kind, links, variables, body, completion) => ({
  type: "Program",
  kind,
  links: kind === "module" ? links : [],
  variables: kind === "script" ? [] : variables,
  body,
  completion,
  tag: bindTag(
    {
      ...reduce(body, combineTag, {}),
      ...completion.tag,
    },
    variables,
  ),
});

///////////
// Block //
///////////

/**
 * @type {<X>(
 *   labels: string[],
 *   variables: string[],
 *   statements: Statement<Tag<X>>[],
 * ) => Block<Tag<X>>}
 */
export const makeBlock = (labels, variables, body) => ({
  type: "Block",
  labels,
  variables,
  body,
  tag: bindTag(reduce(body, combineTag, {}), variables),
});

///////////////
// Statement //
///////////////

/** @type {<X>(inner: Effect<Tag<X>>) => Statement<Tag<X>>} */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: inner.tag,
});

/**
 * @type {<X>(
 *   kind: VariableKind,
 *   variable: string,
 *   value: Expression<Tag<X>>,
 * ) => Statement<Tag<X>>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, value) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  value,
  tag: value.tag,
});

/** @type {<X>(result: Expression<Tag<X>>) => Statement<Tag<X>>} */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: result.tag,
});

/** @type {<X>() => Statement<Tag<X>>} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: {},
});

/** @type {<X>(label: string) => Statement<Tag<X>>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: {},
});

/** @type {<X>(naked: Block<Tag<X>>) => Statement<Tag<X>>} */
export const makeBlockStatement = (naked) => ({
  type: "BlockStatement",
  naked,
  tag: naked.tag,
});

/**
 * @type {<X>(
 *   if_: Expression<Tag<X>>,
 *   then_: Block<Tag<X>>,
 *   else_: Block<Tag<X>>,
 * ) => Statement<Tag<X>>}
 */
export const makeIfStatement = (if_, then_, else_) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: {
    ...if_.tag,
    ...then_.tag,
    ...else_.tag,
  },
});

/**
 * @type {<X>(
 *   try_: Block<Tag<X>>,
 *   catch_: Block<Tag<X>>,
 *   finally_: Block<Tag<X>>,
 * ) => Statement<Tag<X>>}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: {
    ...try_.tag,
    ...catch_.tag,
    ...finally_.tag,
  },
});

/**
 * @type {<X>(
 *   while_: Expression<Tag<X>>,
 *   loop: Block<Tag<X>>,
 * ) => Statement<Tag<X>>}
 */
export const makeWhileStatement = (while_, loop) => ({
  type: "WhileStatement",
  while: while_,
  loop,
  tag: {
    ...while_.tag,
    ...loop.tag,
  },
});

////////////
// Effect //
////////////

/** @type {<X>(discard: Expression<Tag<X>>) => Effect<Tag<X>>} */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: discard.tag,
});

/**
 * @type {<X>(
 *   variable: string,
 *   value: Expression<Tag<X>>,
 *   binding: X,
 * ) => Effect<Tag<X>>}
 */
export const makeWriteEffect = (variable, right, binding) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    ...right.tag,
    [variable]: binding,
  },
});

/**
 * @type {<X>(
 *   variable: string,
 *   value: Expression<Tag<X>>,
 * ) => Effect<Tag<X>>}
 */
export const makeWriteEnclaveEffect = (variable, right) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag: right.tag,
});

/**
 * @type {<X>(
 *   export_: string,
 *   value: Expression<Tag<X>>,
 * ) => Effect<Tag<X>>}
 */
export const makeExportEffect = (export_, right) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag: right.tag,
});

////////////////
// Expression //
////////////////

/** @type {<X>(primitive: PackPrimitive) => Expression<Tag<X>>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: {},
});

/** @type {<X>(parameter: Parameter) => Expression<Tag<X>>} */
export const makeParameterExpression = (parameter) => ({
  type: "ParameterExpression",
  parameter,
  tag: {},
});

/**
 * @type {<X>(
 *   source: string,
 *   import_: string | null,
 * ) => Expression<Tag<X>>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: {},
});

/** @type {<X>(intrinsic: Intrinsic) => Expression<Tag<X>>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: {},
});

/** @type {<X>(variable: string, binding: X) => Expression<Tag<X>>} */
export const makeReadExpression = (variable, binding) => ({
  type: "ReadExpression",
  variable,
  tag: { [variable]: binding },
});

/** @type {<X>(variable: string) => Expression<Tag<X>>} */
export const makeReadEnclaveExpression = (variable) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag: {},
});

/** @type {<X>(variable: string) => Expression<Tag<X>>} */
export const makeTypeofEnclaveExpression = (variable) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag: {},
});

/**
 * @type {<X>(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   variables: string[],
 *   body: Statement<Tag<X>>[],
 *   completion: Expression<Tag<X>>,
 * ) => Expression<Tag<X>>}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  variables,
  body,
  completion,
) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  variables,
  body,
  completion,
  tag: bindTag(
    {
      ...reduce(body, combineTag, {}),
      ...completion.tag,
    },
    variables,
  ),
});

/** @type {<X>(promise: Expression<Tag<X>>) => Expression<Tag<X>>} */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: promise.tag,
});

/**
 * @type {<X>(
 *   delegate: boolean,
 *   item: Expression<Tag<X>>,
 * ) => Expression<Tag<X>>}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: item.tag,
});

/**
 * @type {<X>(
 *   head: Effect<Tag<X>>,
 *   tail: Expression<Tag<X>>,
 * ) => Expression<Tag<X>>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: {
    ...head.tag,
    ...tail.tag,
  },
});

/**
 * @type {<X>(
 *   condition: Expression<Tag<X>>,
 *   consequent: Expression<Tag<X>>,
 *   alternate: Expression<Tag<X>>,
 * ) => Expression<Tag<X>>}
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
  tag: {
    ...condition.tag,
    ...consequent.tag,
    ...alternate.tag,
  },
});

/** @type {<X>(code: Expression<Tag<X>>) => Expression<Tag<X>>} */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
  tag: code.tag,
});

/**
 * @type {<X>(
 *   callee: Expression<Tag<X>>,
 *   this_: Expression<Tag<X>>,
 *   arguments_: Expression<Tag<X>>[],
 * ) => Expression<Tag<X>>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: {
    ...callee.tag,
    ...this_.tag,
    ...reduce(arguments_, combineTag, {}),
  },
});

/**
 * @type {<X>(
 *   callee: Expression<Tag<X>>,
 *   arguments_: Expression<Tag<X>>[],
 * ) => Expression<Tag<X>>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: {
    ...callee.tag,
    ...reduce(arguments_, combineTag, {}),
  },
});
