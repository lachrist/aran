import { AranError } from "../error.mjs";
import { listChild } from "../lang.mjs";
import { compileGet, filterNarrow, map } from "../util/index.mjs";
import { isContextTell, isHeaderTell, isLogTell } from "./tell.mjs";

/** @type {any[]} */
const EMPTY = [];

//////////
// Tell //
//////////

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   tell: import("./tell.d.ts").LogTell | import("./tell.d.ts").HeaderTell,
 * ) => N}
 */
export const tell = (node, tell) => ({
  ...node,
  tag: {
    path: node.tag.path,
    tells: [...node.tag.tells, tell],
  },
});

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   log: import("../../type/unbuild.js").Log,
 * ) => N}
 */
export const tellLog = (node, log) => ({
  ...node,
  tag: {
    path: node.tag.path,
    tells: [...node.tag.tells, { type: "log", log }],
  },
});

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   header: import("../header.js").Header,
 * ) => N}
 */
export const tellHeader = (node, header) => ({
  ...node,
  tag: {
    path: node.tag.path,
    tells: [...node.tag.tells, { type: "header", header }],
  },
});

//////////
// List //
//////////

/**
 * @type {(
 *   node: aran.Node<unbuild.Atom> & { type: "EvalExpression" },
 * ) => import("./context.d.ts").EvalContext}
 */
export const getEvalContext = (node) => {
  const contexts = filterNarrow(node.tag.tells, isContextTell);
  switch (contexts.length) {
    case 0: {
      throw new AranError("missing context on eval expression", node);
    }
    case 1: {
      return contexts[0].context;
    }
    default: {
      throw new AranError("multiple contexts on eval expression", node);
    }
  }
};

/**
 * @type {(
 *   node: aran.ControlBlock<unbuild.Atom> | aran.ClosureBlock<unbuild.Atom>,
 * ) => aran.Node<unbuild.Atom>[]}
 */
const listBlockBody = (node) => {
  switch (node.type) {
    case "ClosureBlock": {
      return [...node.statements, node.completion];
    }
    case "ControlBlock": {
      return node.statements;
    }
    default: {
      throw new AranError("invalid block node type", node);
    }
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: aran.ControlBlock<unbuild.Atom> | aran.ClosureBlock<unbuild.Atom>,
 * ) => unbuild.MetaVariable[]}
 */
export const listMetaDeclaration = (node) => {
  /** @type {import("../../type/unbuild.js").MetaVariable[]} */
  const variables = [];
  let length = 0;
  /** @type {aran.Node<unbuild.Atom>[]} */
  const stack = listBlockBody(node);
  let todo = stack.length;
  while (todo > 0) {
    todo -= 1;
    const node = stack[todo];
    for (const tell of node.tag.tells) {
      if (tell.type === "declaration") {
        variables[length] = tell.variable;
        length += 1;
      }
    }
    if (node.type !== "ClosureBlock" && node.type !== "ControlBlock") {
      for (const child of listChild(node)) {
        stack[todo] = child;
        todo += 1;
      }
    }
  }
  return variables;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @template X
 * @param {(
 *  node: aran.Node<unbuild.Atom>,
 * ) => X[]} list
 * @return {(
 *  node: aran.Node<unbuild.Atom>,
 * ) => X[]}
 */
export const compileListTag = (list) => (node) => {
  /** @type {X[]} */
  const array = [];
  let length = 0;
  /** @type {aran.Node<unbuild.Atom>[]} */
  const stack = [node];
  let todo = stack.length;
  while (todo > 0) {
    todo -= 1;
    const node = stack[todo];
    for (const item of list(node)) {
      array[length] = item;
      length += 1;
    }
    for (const child of listChild(node)) {
      stack[todo] = child;
      todo += 1;
    }
  }
  return array;
};
/* eslint-enable local/no-impure */

const getLog = compileGet("log");

const getHeader = compileGet("header");

export const listLog = compileListTag(({ tag: { tells } }) =>
  map(filterNarrow(tells, isLogTell), getLog),
);

export const listHeader = compileListTag(({ tag: { tells } }) =>
  map(filterNarrow(tells, isHeaderTell), getHeader),
);

/////////////
// Program //
/////////////

/**
 * @type {(
 *   head: import("../header.js").Header[],
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Program<unbuild.Atom>}
 */
export const makeProgram = (head, body, path) => ({
  type: "Program",
  head,
  body,
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeDebuggerStatement = (path) => ({
  type: "DebuggerStatement",
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: unbuild.BaseVariable,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteBaseEffect = (variable, right, path) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: aran.Parameter,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteParameterEffect = (parameter, right, path) => ({
  type: "WriteEffect",
  variable: parameter,
  right,
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: unbuild.MetaVariable,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeInitMetaEffect = (variable, right, path) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: {
    path,
    tells: [{ type: "declaration", variable }],
  },
});

/**
 * @type {(
 *   variable: unbuild.WritableMetaVariable,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const makeWriteMetaEffect = (variable, right, path) => ({
  type: "WriteEffect",
  variable,
  right,
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: unbuild.BaseVariable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadBaseExpression = (variable, path) => ({
  type: "ReadExpression",
  variable,
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: unbuild.MetaVariable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadMetaExpression = (variable, path) => ({
  type: "ReadExpression",
  variable,
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   variable: aran.Parameter,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadParameterExpression = (parameter, path) => ({
  type: "ReadExpression",
  variable: parameter,
  tag: {
    path,
    tells: EMPTY,
  },
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFunctionExpression = (
  asynchronous,
  generator,
  body,
  path,
) => ({
  type: "FunctionExpression",
  asynchronous,
  generator,
  body,
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: false,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeArrowExpression = (asynchronous, _generator, body, path) => ({
  type: "ArrowExpression",
  asynchronous,
  body,
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>[],
 *   tail: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSequenceExpression = (head, tail, path) => {
  if (head.length === 0) {
    return tail;
  } else if (tail.type === "SequenceExpression") {
    return {
      type: "SequenceExpression",
      head: [...head, ...tail.head],
      tail: tail.tail,
      tag: { path, tells: EMPTY },
    };
  } else {
    return {
      type: "SequenceExpression",
      head,
      tail,
      tag: { path, tells: EMPTY },
    };
  }
};

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
  tag: { path, tells: EMPTY },
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
  tag: {
    path,
    tells: [
      {
        type: "context",
        context,
      },
    ],
  },
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
  tag: { path, tells: EMPTY },
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
  tag: { path, tells: EMPTY },
});
