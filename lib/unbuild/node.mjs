import { isParameter } from "../lang.mjs";

const { Error } = globalThis;

// /**
//  * @type {<N extends aran.Node<unbuild.Atom>>(
//  *   node: N,
//  *   origin: unbuild.Path,
//  * ) => N & { tag: { origin: unbuild.Path }}}
//  */
// export const setOrigin = (node, origin) => ({
//   ...node,
//   tag: {
//     ...node.tag,
//     origin,
//   },
// });

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
 *   origin: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeScriptProgram = (body, origin) => ({
  type: "ScriptProgram",
  body,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   links: aran.Link<unbuild.Atom>[],
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeModuleProgram = (links, body, origin) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeEvalProgram = (body, origin) => ({
  type: "EvalProgram",
  body,
  tag: { origin, initialization: null, context: null },
});

//////////
// Link //
//////////

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   origin: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeImportLink = (source, import_, origin) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   origin: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeExportLink = (export_, origin) => ({
  type: "ExportLink",
  export: export_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 *   origin: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeAggregateLink = (source, import_, export_, origin) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag: { origin, initialization: null, context: null },
});

///////////
// Block //
///////////

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 *   origin: unbuild.Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const makeControlBlock = (labels, variables, statements, origin) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeClosureBlock = (
  variables,
  statements,
  completion,
  origin,
) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const makePseudoBlock = (statements, completion, origin) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: { origin, initialization: null, context: null },
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeEffectStatement = (inner, origin) => ({
  type: "EffectStatement",
  inner,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDeclareGlobalStatement = (kind, variable, right, origin) => ({
  type: "DeclareGlobalStatement",
  kind,
  variable,
  right,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   result: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeReturnStatement = (result, origin) => ({
  type: "ReturnStatement",
  result,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDebuggerStatement = (origin) => ({
  type: "DebuggerStatement",
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   label: unbuild.Label,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBreakStatement = (label, origin) => ({
  type: "BreakStatement",
  label,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   do_: aran.ControlBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBlockStatement = (do_, origin) => ({
  type: "BlockStatement",
  do: do_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   if_: aran.Expression<unbuild.Atom>,
 *   then_: aran.ControlBlock<unbuild.Atom>,
 *   else_: aran.ControlBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeIfStatement = (if_, then_, else_, origin) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   try_: aran.ControlBlock<unbuild.Atom>,
 *   catch_: aran.ControlBlock<unbuild.Atom>,
 *   finally_: aran.ControlBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeTryStatement = (try_, catch_, finally_, origin) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   while_: aran.Expression<unbuild.Atom>,
 *   do_: aran.ControlBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeWhileStatement = (while_, do_, origin) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag: { origin, initialization: null, context: null },
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExpressionEffect = (discard, origin) => ({
  type: "ExpressionEffect",
  discard,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   conditional: aran.Expression<unbuild.Atom>,
 *   positive: aran.Effect<unbuild.Atom>[],
 *   negative: aran.Effect<unbuild.Atom>[],
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeConditionalEffect = (
  condition,
  positive,
  negative,
  origin,
) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   initialization: boolean,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteEffect = (variable, right, initialization, origin) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    origin,
    initialization: initialization && !isParameter(variable) ? variable : null,
    context: null,
  },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteGlobalEffect = (variable, right, origin) => ({
  type: "WriteGlobalEffect",
  variable,
  right,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExportEffect = (export_, right, origin) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag: { origin, initialization: null, context: null },
});

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makePrimitiveExpression = (primitive, origin) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportExpression = (source, import_, origin) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIntrinsicExpression = (intrinsic, origin) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadExpression = (variable, origin) => ({
  type: "ReadExpression",
  variable,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadGlobalExpression = (variable, origin) => ({
  type: "ReadGlobalExpression",
  variable,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofGlobalExpression = (variable, origin) => ({
  type: "TypeofGlobalExpression",
  variable,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.FunctionKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFunctionExpression = (
  kind,
  asynchronous,
  generator,
  body,
  origin,
) => ({
  type: "FunctionExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   promise: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAwaitExpression = (promise, origin) => ({
  type: "AwaitExpression",
  promise,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeYieldExpression = (delegate, item, origin) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSequenceExpression = (head, tail, origin) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   condition: aran.Expression<unbuild.Atom>,
 *   consequent: aran.Expression<unbuild.Atom>,
 *   alternate: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  origin,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   code: aran.Expression<unbuild.Atom>,
 *   context: import("./context").EvalContext,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEvalExpression = (code, context, origin) => ({
  type: "EvalExpression",
  code,
  tag: { origin, initialization: null, context },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeApplyExpression = (callee, this_, arguments_, origin) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: { origin, initialization: null, context: null },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConstructExpression = (callee, arguments_, origin) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: { origin, initialization: null, context: null },
});
