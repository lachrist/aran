import { removeAll, reduce, flatMap } from "../util/index.mjs";

import { isParameter } from "../lang.mjs";

/** @type {(node: aran.Node<weave.ResAtom>) => weave.ResVariable[]} */
const getNodeTag = ({ tag }) => tag;

/**
 * @type {(
 *   variables: weave.ResVariable[],
 *   node: aran.Node<weave.ResAtom>,
 * ) => weave.ResVariable[]}
 */
const combineTag = (variables, node) => [...variables, ...node.tag];

///////////
// Block //
///////////

/**
 * @type {(
 *   statements: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
export const makePseudoBlock = (statements, completion) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: [...reduce(statements, combineTag, []), ...completion.tag],
});

/**
 * @type {(
 *   variables: weave.ResVariable[],
 *   statements: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
 * ) => aran.ClosureBlock<weave.ResAtom>}
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
 *   labels: weave.Label[],
 *   variables: weave.ResVariable[],
 *   statements: aran.Statement<weave.ResAtom>[],
 * ) => aran.ControlBlock<weave.ResAtom>}
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
 *   body: aran.PseudoBlock<weave.ResAtom>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const makeScriptProgram = (body) => ({
  type: "ScriptProgram",
  body,
  tag: body.tag,
});

/**
 * @type {(
 *   links: aran.Link<weave.ResAtom>[],
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: [...body.tag, ...flatMap(links, getNodeTag)],
});

/**
 * @type {(
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Program<weave.ResAtom>}
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
 * ) => aran.Link<weave.ResAtom>}
 */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: [],
});

/** @type {(export_: estree.Specifier) => aran.Link<weave.ResAtom>} */
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
 * ) => aran.Link<weave.ResAtom>}
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
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
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
  tag: [],
});

/** @type {(label: weave.Label) => aran.Statement<weave.ResAtom>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: [],
});

/**
 * @type {(
 *   naked: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeBlockStatement = (do_) => ({
  type: "BlockStatement",
  do: do_,
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
  tag: [...if_.tag, ...then_.tag, ...else_.tag],
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
  tag: [...try_.tag, ...catch_.tag, ...finally_.tag],
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
  do: do_,
  tag: [...while_.tag, ...do_.tag],
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
  tag: [
    ...condition.tag,
    ...flatMap(positive, getNodeTag),
    ...flatMap(negative, getNodeTag),
  ],
});

/**
 * @type {(
 *   variable: aran.Parameter | weave.ResVariable,
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
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
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
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
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
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

/** @type {(primitive: aran.Primitive) => aran.Expression<weave.ResAtom>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: [],
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
  tag: [],
});

/** @type {(intrinsic: aran.Intrinsic) => aran.Expression<weave.ResAtom>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: [],
});

/**
 * @type {(
 *   variable: aran.Parameter | weave.ResVariable,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
  tag: isParameter(variable) ? [] : [variable],
});

/** @type {(variable: estree.Variable) => aran.Expression<weave.ResAtom>} */
export const makeReadEnclaveExpression = (variable) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag: [],
});

/** @type {(variable: estree.Variable) => aran.Expression<weave.ResAtom>} */
export const makeTypeofEnclaveExpression = (variable) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag: [],
});

/**
 * @type {(
 *   kind: aran.FunctionKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeFunctionExpression = (
  kind,
  asynchronous,
  generator,
  body,
) => ({
  type: "FunctionExpression",
  kind,
  asynchronous,
  generator,
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
 *   head: aran.Effect<weave.ResAtom>,
 *   tail: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: [...head.tag, ...tail.tag],
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
  tag: [...condition.tag, ...consequent.tag, ...alternate.tag],
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
  tag: [...callee.tag, ...this_.tag, ...reduce(arguments_, combineTag, [])],
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
  tag: [...callee.tag, ...reduce(arguments_, combineTag, [])],
});
