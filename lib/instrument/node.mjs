import { getNodeTag, isParameter } from "../node.mjs";
import { removeAll, reduce, flatMap } from "../util/index.mjs";

/**
 * @type {(
 *   variables: weave.Variable[],
 *   node: weave.Node,
 * ) => weave.Variable[]}
 */
const combineTag = (variables, node) => [...variables, ...node.tag];

///////////
// Block //
///////////

/**
 * @type {(
 *   statements: weave.Statement[],
 *   completion: weave.Expression,
 * ) => weave.PseudoBlock}
 */
export const makePseudoBlock = (statements, completion) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: [...reduce(statements, combineTag, []), ...completion.tag],
});

/**
 * @type {(
 *   variables: weave.Variable[],
 *   statements: weave.Statement[],
 *   completion: weave.Expression,
 * ) => weave.ClosureBlock}
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
 *   labels: aran.Label[],
 *   variables: weave.Variable[],
 *   statements: weave.Statement[],
 * ) => weave.ControlBlock}
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
 *   body: weave.PseudoBlock,
 * ) => weave.Program}
 */
export const makeScriptProgram = (body) => ({
  type: "ScriptProgram",
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   links: weave.Link[],
 *   body: weave.ClosureBlock,
 * ) => weave.Program}
 */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: [...body.tag, ...flatMap(links, getNodeTag)],
});

/**
 * @type {(
 *   body: weave.ClosureBlock,
 * ) => weave.Program}
 */
export const makeEvalProgram = (body) => ({
  type: "EvalProgram",
  body,
  tag: body.tag,
});

//////////
// Link //
//////////

/**
 * @type {(
 *   source: estree.Source, import_: estree.Specifier | null,
 * ) => weave.Link}
 */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: [],
});

/** @type {(export_: estree.Specifier) => weave.Link} */
export const makeExporLink = (export_) => ({
  type: "ExportLink",
  export: export_,
  tag: [],
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 * ) => weave.Link}
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

/**
 * @type {(
 *   inner: weave.Effect,
 * ) => weave.Statement}
 */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: inner.tag,
});

/**
 * @type {(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: weave.Expression,
 * ) => weave.Statement}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag: right.tag,
});

/**
 * @type {(
 *   result: weave.Expression,
 * ) => weave.Statement}
 */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: result.tag,
});

/** @type {() => weave.Statement} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: [],
});

/** @type {(label: aran.Label) => weave.Statement} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: [],
});

/**
 * @type {(
 *   naked: weave.ControlBlock,
 * ) => weave.Statement}
 */
export const makeBlockStatement = (do_) => ({
  type: "BlockStatement",
  do: do_,
  tag: do_.tag,
});

/**
 * @type {(
 *   if_: weave.Expression,
 *   then_: weave.ControlBlock,
 *   else_: weave.ControlBlock,
 * ) => weave.Statement}
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
 *   try_: weave.ControlBlock,
 *   catch_: weave.ControlBlock,
 *   finally_: weave.ControlBlock,
 * ) => weave.Statement}
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
 *   while_: weave.Expression,
 *   loop: weave.ControlBlock,
 * ) => weave.Statement}
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

/**
 * @type {(
 *   discard: weave.Expression,
 * ) => weave.Effect}
 */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: discard.tag,
});

/**
 * @type {(
 *   conditional: weave.Expression,
 *   positive: weave.Effect[],
 *   negative: weave.Effect[],
 * ) => weave.Effect}
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
 *   variable: aran.Parameter | weave.Variable,
 *   value: weave.Expression,
 * ) => weave.Effect}
 */
export const makeWriteEffect = (variable, right) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: isParameter(variable) ? right.tag : [...right.tag, variable],
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   value: weave.Expression,
 * ) => weave.Effect}
 */
export const makeWriteEnclaveEffect = (variable, right) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag: right.tag,
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: weave.Expression,
 * ) => weave.Effect}
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

/** @type {(primitive: aran.Primitive) => weave.Expression} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: [],
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => weave.Expression}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: [],
});

/** @type {(intrinsic: aran.Intrinsic) => weave.Expression} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: [],
});

/**
 * @type {(
 *   variable: aran.Parameter | weave.Variable,
 * ) => weave.Expression}
 */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
  tag: isParameter(variable) ? [] : [variable],
});

/** @type {(variable: estree.Variable) => weave.Expression} */
export const makeReadEnclaveExpression = (variable) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag: [],
});

/** @type {(variable: estree.Variable) => weave.Expression} */
export const makeTypeofEnclaveExpression = (variable) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag: [],
});

/**
 * @type {(
 *   kind: aran.ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: weave.ClosureBlock,
 * ) => weave.Expression}
 */
export const makeClosureExpression = (kind, asynchronous, generator, body) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   promise: weave.Expression,
 * ) => weave.Expression}
 */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: promise.tag,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: weave.Expression,
 * ) => weave.Expression}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: item.tag,
});

/**
 * @type {(
 *   head: weave.Effect,
 *   tail: weave.Expression,
 * ) => weave.Expression}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: [...head.tag, ...tail.tag],
});

/**
 * @type {(
 *   condition: weave.Expression,
 *   consequent: weave.Expression,
 *   alternate: weave.Expression,
 * ) => weave.Expression}
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

/**
 * @type {(
 *   code: weave.Expression,
 * ) => weave.Expression}
 */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
  tag: code.tag,
});

/**
 * @type {(
 *   callee: weave.Expression,
 *   this_: weave.Expression,
 *   arguments_: weave.Expression[],
 * ) => weave.Expression}
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
 *   callee: weave.Expression,
 *   arguments_: weave.Expression[],
 * ) => weave.Expression}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: [...callee.tag, ...reduce(arguments_, combineTag, [])],
});
