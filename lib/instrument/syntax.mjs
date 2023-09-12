import { getNodeTag } from "../node.mjs";
import { removeAll, reduce, flatMap } from "../util/index.mjs";

/** @type {(variables: Variable[], node: Node<Variable[]>) => Variable[]} */
const combineTag = (variables, node) => [...variables, ...node.tag];

///////////
// Block //
///////////

/**
 * @type {(
 *   statements: Statement<Variable[]>[],
 *   completion: Expression<Variable[]>,
 * ) => PseudoBlock<Variable[]>}
 */
export const makePseudoBlock = (statements, completion) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: [...reduce(statements, combineTag, []), ...completion.tag],
});

/**
 * @type {(
 *   variables: Variable[],
 *   statements: Statement<Variable[]>[],
 *   completion: Expression<Variable[]>,
 * ) => ClosureBlock<Variable[]>}
 */
export const makeClosureBlock = (variables, statements, completion) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag: removeAll(
    [...reduce(statements, combineTag, []), ...completion.tag],
    variables,
  ),
});

/**
 * @type {(
 *   labels: Label[],
 *   variables: Variable[],
 *   statements: Statement<Variable[]>[],
 * ) => ControlBlock<Variable[]>}
 */
export const makeControlBlock = (labels, variables, statements) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag: removeAll(reduce(statements, combineTag, []), variables),
});

/////////////
// Program //
/////////////

/**
 * @type {(
 *   body: PseudoBlock<Variable[]>,
 * ) => Program<Variable[]>}
 */
export const makeScriptProgram = (body) => ({
  type: "ScriptProgram",
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   links: Link<Variable[]>[],
 *   body: ClosureBlock<Variable[]>,
 * ) => Program<Variable[]>}
 */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: [...body.tag, ...flatMap(links, getNodeTag)],
});

/**
 * @type {(
 *   body: ClosureBlock<Variable[]>,
 * ) => Program<Variable[]>}
 */
export const makeEvalProgram = (body) => ({
  type: "EvalProgram",
  body,
  tag: body.tag,
});

//////////
// Link //
//////////

/** @type {(source: Source, import_: Specifier | null) => Link<Variable[]>} */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: [],
});

/** @type {(export_: Specifier) => Link<Variable[]>} */
export const makeExporLink = (export_) => ({
  type: "ExportLink",
  export: export_,
  tag: [],
});

/**
 * @type {(
 *   source: Source,
 *   import_: Specifier | null,
 *   export_: Specifier | null,
 * ) => Link<Variable[]>}
 */
export const makeAggregateLink = (source, import_, export_) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag: [],
});

///////////////
// Statement //
///////////////

/** @type {(inner: Effect<Variable[]>) => Statement<Variable[]>} */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: inner.tag,
});

/**
 * @type {(
 *   kind: VariableKind,
 *   variable: Variable,
 *   right: Expression<Variable[]>,
 * ) => Statement<Variable[]>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag: right.tag,
});

/** @type {(result: Expression<Variable[]>) => Statement<Variable[]>} */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: result.tag,
});

/** @type {() => Statement<Variable[]>} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: [],
});

/** @type {(label: Label) => Statement<Variable[]>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: [],
});

/** @type {(naked: ControlBlock<Variable[]>) => Statement<Variable[]>} */
export const makeBlockStatement = (do_) => ({
  type: "BlockStatement",
  do: do_,
  tag: do_.tag,
});

/**
 * @type {(
 *   if_: Expression<Variable[]>,
 *   then_: ControlBlock<Variable[]>,
 *   else_: ControlBlock<Variable[]>,
 * ) => Statement<Variable[]>}
 */
export const makeIfStatement = (if_, then_, else_) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: [...if_.tag, ...then_.tag, ...else_.tag],
});

/**
 * @type {(
 *   try_: ControlBlock<Variable[]>,
 *   catch_: ControlBlock<Variable[]>,
 *   finally_: ControlBlock<Variable[]>,
 * ) => Statement<Variable[]>}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: [...try_.tag, ...catch_.tag, ...finally_.tag],
});

/**
 * @type {(
 *   while_: Expression<Variable[]>,
 *   loop: ControlBlock<Variable[]>,
 * ) => Statement<Variable[]>}
 */
export const makeWhileStatement = (while_, do_) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag: [...while_.tag, ...do_.tag],
});

////////////
// Effect //
////////////

/** @type {(discard: Expression<Variable[]>) => Effect<Variable[]>} */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: discard.tag,
});

/**
 * @type {<T>(
 *   conditional: Expression<Variable[]>,
 *   positive: Effect<Variable[]>[],
 *   negative: Effect<Variable[]>[],
 * ) => Effect<Variable[]>}
 */
export const makeConditionalEffect = (condition, positive, negative) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: [
    ...condition.tag,
    ...flatMap(positive, getNodeTag),
    ...flatMap(negative, getNodeTag),
  ],
});

/**
 * @type {(
 *   variable: Variable,
 *   value: Expression<Variable[]>,
 * ) => Effect<Variable[]>}
 */
export const makeWriteEffect = (variable, right) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: [...right.tag, variable],
});

/**
 * @type {(
 *   variable: Variable,
 *   value: Expression<Variable[]>,
 * ) => Effect<Variable[]>}
 */
export const makeWriteEnclaveEffect = (variable, right) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag: right.tag,
});

/**
 * @type {(
 *   export_: Specifier,
 *   value: Expression<Variable[]>,
 * ) => Effect<Variable[]>}
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

/** @type {(primitive: PackPrimitive) => Expression<Variable[]>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: [],
});

/** @type {(parameter: Parameter) => Expression<Variable[]>} */
export const makeParameterExpression = (parameter) => ({
  type: "ParameterExpression",
  parameter,
  tag: [],
});

/**
 * @type {(
 *   source: Source,
 *   import_: Specifier | null,
 * ) => Expression<Variable[]>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: [],
});

/** @type {(intrinsic: Intrinsic) => Expression<Variable[]>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: [],
});

/** @type {(variable: Variable) => Expression<Variable[]>} */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
  tag: [variable],
});

/** @type {(variable: Variable) => Expression<Variable[]>} */
export const makeReadEnclaveExpression = (variable) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag: [],
});

/** @type {(variable: Variable) => Expression<Variable[]>} */
export const makeTypeofEnclaveExpression = (variable) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag: [],
});

/**
 * @type {(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: ClosureBlock<Variable[]>,
 * ) => Expression<Variable[]>}
 */
export const makeClosureExpression = (kind, asynchronous, generator, body) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag: body.tag,
});

/** @type {(promise: Expression<Variable[]>) => Expression<Variable[]>} */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: promise.tag,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: Expression<Variable[]>,
 * ) => Expression<Variable[]>}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: item.tag,
});

/**
 * @type {(
 *   head: Effect<Variable[]>,
 *   tail: Expression<Variable[]>,
 * ) => Expression<Variable[]>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: [...head.tag, ...tail.tag],
});

/**
 * @type {(
 *   condition: Expression<Variable[]>,
 *   consequent: Expression<Variable[]>,
 *   alternate: Expression<Variable[]>,
 * ) => Expression<Variable[]>}
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
  tag: [...condition.tag, ...consequent.tag, ...alternate.tag],
});

/** @type {(code: Expression<Variable[]>) => Expression<Variable[]>} */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
  tag: code.tag,
});

/**
 * @type {(
 *   callee: Expression<Variable[]>,
 *   this_: Expression<Variable[]>,
 *   arguments_: Expression<Variable[]>[],
 * ) => Expression<Variable[]>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: [...callee.tag, ...this_.tag, ...reduce(arguments_, combineTag, [])],
});

/**
 * @type {(
 *   callee: Expression<Variable[]>,
 *   arguments_: Expression<Variable[]>[],
 * ) => Expression<Variable[]>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: [...callee.tag, ...reduce(arguments_, combineTag, [])],
});
