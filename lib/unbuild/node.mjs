/////////////
// Program //
/////////////

import { isParameter } from "../lang.mjs";

/**
 * @type {<S>(
 *   body: aran.PseudoBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeScriptProgram = (body, serial) => ({
  type: "ScriptProgram",
  body,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   links: aran.Link<unbuild.Atom<S>>[],
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeModuleProgram = (links, body, serial) => ({
  type: "ModuleProgram",
  links,
  body,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const makeEvalProgram = (body, serial) => ({
  type: "EvalProgram",
  body,
  tag: { serial, initialization: null },
});

//////////
// Link //
//////////

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   serial: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeImportLink = (source, import_, serial) => ({
  type: "ImportLink",
  source,
  import: import_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   export_: estree.Specifier,
 *   serial: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeExportLink = (export_, serial) => ({
  type: "ExportLink",
  export: export_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   export_: estree.Specifier | null,
 *   serial: S,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
export const makeAggregateLink = (source, import_, export_, serial) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
  tag: { serial, initialization: null },
});

///////////
// Block //
///////////

/**
 * @type {<S>(
 *   labels: unbuild.Label[],
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   serial: S
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const makeControlBlock = (labels, variables, statements, serial) => ({
  type: "ControlBlock",
  labels,
  variables,
  statements,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   variables: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   completion: aran.Expression<unbuild.Atom<S>>,
 *   serial: S
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const makeClosureBlock = (
  variables,
  statements,
  completion,
  serial,
) => ({
  type: "ClosureBlock",
  variables,
  statements,
  completion,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   statements: aran.Statement<unbuild.Atom<S>>[],
 *   completion: aran.Expression<unbuild.Atom<S>>,
 *   serial: S
 * ) => aran.PseudoBlock<unbuild.Atom<S>>}
 */
export const makePseudoBlock = (statements, completion, serial) => ({
  type: "PseudoBlock",
  statements,
  completion,
  tag: { serial, initialization: null },
});

///////////////
// Statement //
///////////////

/**
 * @type {<S>(
 *   inner: aran.Effect<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeEffectStatement = (inner, serial) => ({
  type: "EffectStatement",
  inner,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeDeclareEnclaveStatement = (kind, variable, right, serial) => ({
  type: "DeclareEnclaveStatement",
  kind,
  variable,
  right,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   result: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeReturnStatement = (result, serial) => ({
  type: "ReturnStatement",
  result,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeDebuggerStatement = (serial) => ({
  type: "DebuggerStatement",
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   label: unbuild.Label,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeBreakStatement = (label, serial) => ({
  type: "BreakStatement",
  label,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   do_: aran.ControlBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeBlockStatement = (do_, serial) => ({
  type: "BlockStatement",
  do: do_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   if_: aran.Expression<unbuild.Atom<S>>,
 *   then_: aran.ControlBlock<unbuild.Atom<S>>,
 *   else_: aran.ControlBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeIfStatement = (if_, then_, else_, serial) => ({
  type: "IfStatement",
  if: if_,
  then: then_,
  else: else_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   try_: aran.ControlBlock<unbuild.Atom<S>>,
 *   catch_: aran.ControlBlock<unbuild.Atom<S>>,
 *   finally_: aran.ControlBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeTryStatement = (try_, catch_, finally_, serial) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   while_: aran.Expression<unbuild.Atom<S>>,
 *   do_: aran.ControlBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeWhileStatement = (while_, do_, serial) => ({
  type: "WhileStatement",
  while: while_,
  do: do_,
  tag: { serial, initialization: null },
});

////////////
// Effect //
////////////

/**
 * @type {<S>(
 *   discard: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeExpressionEffect = (discard, serial) => ({
  type: "ExpressionEffect",
  discard,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   conditional: aran.Expression<unbuild.Atom<S>>,
 *   positive: aran.Effect<unbuild.Atom<S>>[],
 *   negative: aran.Effect<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeConditionalEffect = (
  condition,
  positive,
  negative,
  serial,
) => ({
  type: "ConditionalEffect",
  condition,
  positive,
  negative,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   variable: aran.Parameter | unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 *   initialization: boolean
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeWriteEffect = (variable, right, serial, initialization) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    serial,
    initialization: initialization && !isParameter(variable) ? variable : null,
  },
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeWriteEnclaveEffect = (variable, right, serial) => ({
  type: "WriteEnclaveEffect",
  variable,
  right,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   export_: estree.Specifier,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const makeExportEffect = (export_, right, serial) => ({
  type: "ExportEffect",
  export: export_,
  right,
  tag: { serial, initialization: null },
});

////////////////
// Expression //
////////////////

/**
 * @type {<S>(
 *   primitive: aran.Primitive,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makePrimitiveExpression = (primitive, serial) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportExpression = (source, import_, serial) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   intrinsic: aran.Intrinsic,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeIntrinsicExpression = (intrinsic, serial) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   variable: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeReadExpression = (variable, serial) => ({
  type: "ReadExpression",
  variable,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeReadEnclaveExpression = (variable, serial) => ({
  type: "ReadEnclaveExpression",
  variable,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeTypeofEnclaveExpression = (variable, serial) => ({
  type: "TypeofEnclaveExpression",
  variable,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   kind: aran.ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  body,
  serial,
) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   promise: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeAwaitExpression = (promise, serial) => ({
  type: "AwaitExpression",
  promise,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   delegate: boolean,
 *   item: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeYieldExpression = (delegate, item, serial) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   head: aran.Effect<unbuild.Atom<S>>,
 *   tail: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSequenceExpression = (head, tail, serial) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   condition: aran.Expression<unbuild.Atom<S>>,
 *   consequent: aran.Expression<unbuild.Atom<S>>,
 *   alternate: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  serial,
) => ({
  type: "ConditionalExpression",
  condition,
  consequent,
  alternate,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   code: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeEvalExpression = (code, serial) => ({
  type: "EvalExpression",
  code,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   callee: aran.Expression<unbuild.Atom<S>>,
 *   this_: aran.Expression<unbuild.Atom<S>>,
 *   arguments_: aran.Expression<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeApplyExpression = (callee, this_, arguments_, serial) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: { serial, initialization: null },
});

/**
 * @type {<S>(
 *   callee: aran.Expression<unbuild.Atom<S>>,
 *   arguments_: aran.Expression<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeConstructExpression = (callee, arguments_, serial) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: { serial, initialization: null },
});
