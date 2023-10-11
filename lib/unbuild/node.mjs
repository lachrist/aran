import { isParameter } from "../lang.mjs";

const { Error } = globalThis;

// /**
//  * @type {<N extends aran.Node<unbuild.Atom>>(
//  *   node: N,
//  *   path: unbuild.Path,
//  * ) => N & { tag: { path: unbuild.Path }}}
//  */
// export const setOrigin = (node, path) => ({
//   ...node,
//   tag: {
//     ...node.tag,
//     path,
//   },
// });

/**
 * @type {(node: aran.Node<unbuild.Atom>) => unbuild.Path | null}
 */
export const getOrigin = ({ tag: { path } }) => path;

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
 *   path: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeScriptProgram = (body, path) => ({
  type: "ScriptProgram",
  body,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   links: aran.Link<unbuild.Atom>[],
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeModuleProgram = (links, body, path) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeEvalProgram = (body, path) => ({
  type: "EvalProgram",
  body,
  tag: { path, initialization: null, context: null },
});

//////////
// Link //
//////////

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   path: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeImportLink = (source, import_, path) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   path: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeExportLink = (export_, path) => ({
  type: "ExportLink",
  export: export_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 *   path: unbuild.Path,
 * ) => aran.Link<unbuild.Atom>}
 */
export const makeAggregateLink = (source, import_, export_, path) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag: { path, initialization: null, context: null },
});

///////////
// Block //
///////////

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const makeControlBlock = (labels, variables, statements, path) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeClosureBlock = (variables, statements, completion, path) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   statements: aran.Statement<unbuild.Atom>[],
 *   completion: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const makePseudoBlock = (statements, completion, path) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: { path, initialization: null, context: null },
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeEffectStatement = (inner, path) => ({
  type: "EffectStatement",
  inner,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDeclareGlobalStatement = (kind, variable, right, path) => ({
  type: "DeclareGlobalStatement",
  kind,
  variable,
  right,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   result: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeReturnStatement = (result, path) => ({
  type: "ReturnStatement",
  result,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDebuggerStatement = (path) => ({
  type: "DebuggerStatement",
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   label: unbuild.Label,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBreakStatement = (label, path) => ({
  type: "BreakStatement",
  label,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   do_: aran.ControlBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeBlockStatement = (do_, path) => ({
  type: "BlockStatement",
  do: do_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   if_: aran.Expression<unbuild.Atom>,
 *   then_: aran.ControlBlock<unbuild.Atom>,
 *   else_: aran.ControlBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeIfStatement = (if_, then_, else_, path) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   try_: aran.ControlBlock<unbuild.Atom>,
 *   catch_: aran.ControlBlock<unbuild.Atom>,
 *   finally_: aran.ControlBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeTryStatement = (try_, catch_, finally_, path) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   while_: aran.Expression<unbuild.Atom>,
 *   do_: aran.ControlBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeWhileStatement = (while_, do_, path) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag: { path, initialization: null, context: null },
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExpressionEffect = (discard, path) => ({
  type: "ExpressionEffect",
  discard,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   conditional: aran.Expression<unbuild.Atom>,
 *   positive: aran.Effect<unbuild.Atom>[],
 *   negative: aran.Effect<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeConditionalEffect = (condition, positive, negative, path) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   initialization: boolean,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteEffect = (variable, right, initialization, path) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    path,
    initialization: initialization && !isParameter(variable) ? variable : null,
    context: null,
  },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteGlobalEffect = (variable, right, path) => ({
  type: "WriteGlobalEffect",
  variable,
  right,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeExportEffect = (export_, right, path) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag: { path, initialization: null, context: null },
});

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makePrimitiveExpression = (primitive, path) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportExpression = (source, import_, path) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIntrinsicExpression = (intrinsic, path) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadExpression = (variable, path) => ({
  type: "ReadExpression",
  variable,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadGlobalExpression = (variable, path) => ({
  type: "ReadGlobalExpression",
  variable,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofGlobalExpression = (variable, path) => ({
  type: "TypeofGlobalExpression",
  variable,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   kind: aran.FunctionKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFunctionExpression = (
  kind,
  asynchronous,
  generator,
  body,
  path,
) => ({
  type: "FunctionExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   promise: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAwaitExpression = (promise, path) => ({
  type: "AwaitExpression",
  promise,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeYieldExpression = (delegate, item, path) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSequenceExpression = (head, tail, path) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   condition: aran.Expression<unbuild.Atom>,
 *   consequent: aran.Expression<unbuild.Atom>,
 *   alternate: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  path,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   code: aran.Expression<unbuild.Atom>,
 *   context: import("./context").EvalContext,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEvalExpression = (code, context, path) => ({
  type: "EvalExpression",
  code,
  tag: { path, initialization: null, context },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeApplyExpression = (callee, this_, arguments_, path) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: { path, initialization: null, context: null },
});

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   arguments_: aran.Expression<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConstructExpression = (callee, arguments_, path) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: { path, initialization: null, context: null },
});
