/////////////
// Program //
/////////////

/**
 * @type {<S>(
 *   body: aran.PseudoBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeScriptProgram = (body, tag) => ({
  type: "ScriptProgram",
  body,
  tag,
});

/**
 * @type {<S>(
 *   links: aran.Link<unbuild.Atom<S>>[],
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeModuleProgram = (links, body, tag) => ({
  type: "ModuleProgram",
  links,
  body,
  tag,
});

/**
 * @type {<S>(
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeEvalProgram = (body, tag) => ({
  type: "EvalProgram",
  body,
  tag,
});

//////////
// Link //
//////////

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeImportLink = (source, import_, tag) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag,
});

/**
 * @type {<S>(
 *   export_: estree.Specifier,
 *   tag: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeExportLink = (export_, tag) => ({
  type: "ExportLink",
  export: export_,
  tag,
});

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 *   tag: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeAggregateLink = (source, import_, export_, tag) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag,
});

///////////
// Block //
///////////

/**
 * @type {<S>(
 *   labels: unbuild.Label[],
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   tag: S
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const makeControlBlock = (labels, variables, statements, tag) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag,
});

/**
 * @type {<S>(
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   completion: aran.Expression<unbuild.Atom<S>>,
 *   tag: S
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const makeClosureBlock = (variables, statements, completion, tag) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag,
});

/**
 * @type {<S>(
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   completion: aran.Expression<unbuild.Atom<S>>,
 *   tag: S
 * ) => aran.PseudoBlock<unbuild.Atom<S>>}
 */
export const makePseudoBlock = (statements, completion, tag) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag,
});

///////////////
// Statement //
///////////////

/**
 * @type {<S>(
 *   inner: aran.Effect<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<S>(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right, tag) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag,
});

/**
 * @type {<S>(
 *   result: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/**
 * @type {<S>(
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/**
 * @type {<S>(
 *   label: unbuild.Label,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/**
 * @type {<S>(
 *   do_: aran.ControlBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeBlockStatement = (do_, tag) => ({
  type: "BlockStatement",
  do: do_,
  tag,
});

/**
 * @type {<S>(
 *   if_: aran.Expression<unbuild.Atom<S>>,
 *   then_: aran.ControlBlock<unbuild.Atom<S>>,
 *   else_: aran.ControlBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeIfStatement = (if_, then_, else_, tag) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<S>(
 *   try_: aran.ControlBlock<unbuild.Atom<S>>,
 *   catch_: aran.ControlBlock<unbuild.Atom<S>>,
 *   finally_: aran.ControlBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<S>(
 *   while_: aran.Expression<unbuild.Atom<S>>,
 *   do_: aran.ControlBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeWhileStatement = (while_, do_, tag) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag,
});

////////////
// Effect //
////////////

/**
 * @type {<S>(
 *   discard: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {<S>(
 *   conditional: aran.Expression<unbuild.Atom<S>>,
 *   positive: aran.Effect<unbuild.Atom<S>>[],
 *   negative: aran.Effect<unbuild.Atom<S>>[],
 *   tag: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeConditionalEffect = (condition, positive, negative, tag) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag,
});

/**
 * @type {<S>(
 *   variable: aran.Parameter | unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeWriteEffect = (variable, right, tag) => ({
  type: "WriteEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeWriteEnclaveEffect = (variable, right, tag) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag,
});

/**
 * @type {<S>(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeExportEffect = (export_, right, tag) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag,
});

////////////////
// Expression //
////////////////

/**
 * @type {<S>(
 *   primitive: aran.Primitive,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/**
 * @type {<S>(
 *   intrinsic: aran.Intrinsic,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/**
 * @type {<S>(
 *   variable: aran.Parameter | unbuild.Variable,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeReadEnclaveExpression = (variable, tag) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeTypeofEnclaveExpression = (variable, tag) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag,
});

/**
 * @type {<S>(
 *   kind: aran.ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  body,
  tag,
) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag,
});

/**
 * @type {<S>(
 *   promise: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<S>(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<S>(
 *   head: aran.Effect<unbuild.Atom<S>>,
 *   tail: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSequenceExpression = (head, tail, tag) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag,
});

/**
 * @type {<S>(
 *   condition: aran.Expression<unbuild.Atom<S>>,
 *   consequent: aran.Expression<unbuild.Atom<S>>,
 *   alternate: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  tag,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag,
});

/**
 * @type {<S>(
 *   code: aran.Expression<unbuild.Atom<S>>,
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<S>(
 *   callee: aran.Expression<unbuild.Atom<S>>,
 *   this_: aran.Expression<unbuild.Atom<S>>,
 *   arguments_: aran.Expression<unbuild.Atom<S>>[],
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<S>(
 *   callee: aran.Expression<unbuild.Atom<S>>,
 *   arguments_: aran.Expression<unbuild.Atom<S>>[],
 *   tag: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
