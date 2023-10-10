import { isParameter } from "../lang.mjs";

const { Error } = globalThis;

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   origin: unbuild.Path | null,
 * ) => N}
 */
export const setOrigin = (node, origin) => ({
  ...node,
  tag: {
    ...node.tag,
    origin,
  },
});

/**
 * @type {(node: aran.Node<unbuild.Atom>) => unbuild.Path | null}
 */
export const getOrigin = ({ tag: { origin } }) => origin;

/**
 * @type {(
 *   node: aran.Node<unbuild.Atom> & { type: "WriteEffect" },
 * ) => boolean}
 */
export const isInitialization = ({ tag: initialization }) =>
  initialization !== null;

/**
 * @type {(
 *   node: aran.Node<unbuild.Atom> & { type: "EvalExpression" },
 * ) => import("./context.d.ts").EvalContext}
 */
export const getEvalContext = ({ tag: { context } }) => {
  if (context === null) {
    throw new Error("missing context on eval call expression");
  } else {
    return context;
  }
};

/////////////
// Program //
/////////////

/**
 * @type {(
 *   body: aran.PseudoBlock<unbuild.Atom>,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeScriptProgram = (body) => ({
  type: "ScriptProgram",
  body,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   links: aran.Link<unbuild.Atom>[],
 *   body: aran.ClosureBlock<unbuild.Atom>,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   body: aran.ClosureBlock<unbuild.Atom>,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeEvalProgram = (body) => ({
  type: "EvalProgram",
  body,
  tag: { origin: null, initialization: null, context: null },
});

//////////
// Link //
//////////

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeExportLink = (export_) => ({
  type: "ExportLink",
  export: export_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeAggregateLink = (source, import_, export_) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag: { origin: null, initialization: null, context: null },
});

///////////
// Block //
///////////

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const makeControlBlock = (labels, variables, statements) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeClosureBlock = (variables, statements, completion) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const makePseudoBlock = (statements, completion) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: { origin: null, initialization: null, context: null },
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDeclareGlobalStatement = (kind, variable, right) => ({
  type: "DeclareGlobalStatement",
  kind,
  variable,
  right,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   result: aran.Expression<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   label: unbuild.Label,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   do_: aran.ControlBlock<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBlockStatement = (do_) => ({
  type: "BlockStatement",
  do: do_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   if_: aran.Expression<unbuild.Atom>,
 *   then_: aran.ControlBlock<unbuild.Atom>,
 *   else_: aran.ControlBlock<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeIfStatement = (if_, then_, else_) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   try_: aran.ControlBlock<unbuild.Atom>,
 *   catch_: aran.ControlBlock<unbuild.Atom>,
 *   finally_: aran.ControlBlock<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   while_: aran.Expression<unbuild.Atom>,
 *   do_: aran.ControlBlock<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeWhileStatement = (while_, do_) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag: { origin: null, initialization: null, context: null },
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<unbuild.Atom>,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   conditional: aran.Expression<unbuild.Atom>,
 *   positive: aran.Effect<unbuild.Atom>[],
 *   negative: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeConditionalEffect = (condition, positive, negative) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   initialization: boolean
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteEffect = (variable, right, initialization) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    origin: null,
    initialization: initialization && !isParameter(variable) ? variable : null,
    context: null,
  },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteGlobalEffect = (variable, right) => ({
  type: "WriteGlobalEffect",
  variable,
  right,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExportEffect = (export_, right) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag: { origin: null, initialization: null, context: null },
});

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadGlobalExpression = (variable) => ({
  type: "ReadGlobalExpression",
  variable,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofGlobalExpression = (variable) => ({
  type: "TypeofGlobalExpression",
  variable,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.FunctionKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
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
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   promise: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   condition: aran.Expression<unbuild.Atom>,
 *   consequent: aran.Expression<unbuild.Atom>,
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
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
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   code: aran.Expression<unbuild.Atom>,
 *   context: import("./context").EvalContext,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEvalExpression = (code, context) => ({
  type: "EvalExpression",
  code,
  tag: { origin: null, initialization: null, context },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: { origin: null, initialization: null, context: null },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: { origin: null, initialization: null, context: null },
});
