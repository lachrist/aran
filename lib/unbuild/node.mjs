import { compileGet, filterNarrow, flatMap, map } from "../util/index.mjs";
import { makeEarlyErrorStatement } from "./early-error.mjs";
import {
  isBlockPrelude,
  isDeclarationPrelude,
  isEarlyErrorPrelude,
  isHeaderPrelude,
  isProgramPrelude,
} from "./prelude.mjs";

const getTail = compileGet("tail");

const getHead = compileGet("head");

const getData = compileGet("data");

/** @type {never[]} */
const EMPTY = [];

/////////////
// Program //
/////////////

/**
 * @type {(
 *   body: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ProgramSequence}
 */
export const makeProgram = (body, tag) => ({
  head: filterNarrow(body.head, isProgramPrelude),
  tail: {
    type: "Program",
    head: map(filterNarrow(body.head, isHeaderPrelude), getData),
    body: {
      type: "ClosureBlock",
      variables: body.tail.variables,
      statements: [
        ...map(
          map(filterNarrow(body.head, isEarlyErrorPrelude), getData),
          makeEarlyErrorStatement,
        ),
        ...body.tail.statements,
      ],
      completion: body.tail.completion,
      tag: body.tail.tag,
    },
    tag,
  },
});

///////////
// Block //
///////////

/**
 * @type {(
 *  labels: unbuild.Label[],
 *  body: import("./sequence").StatementSequence,
 *  tag: unbuild.Path,
 * ) => import("./sequence").ControlBlockSequence}
 */
export const makeControlBlock = (labels, body, tag) => ({
  head: filterNarrow(body.head, isBlockPrelude),
  tail: {
    type: "ControlBlock",
    labels,
    variables: map(filterNarrow(body.head, isDeclarationPrelude), getData),
    statements: body.tail,
    tag,
  },
});

/**
 * @type {(
 *  body: import("./sequence").CompletionSequence,
 *  tag: unbuild.Path,
 * ) => import("./sequence").ClosureBlockSequence}
 */
export const makeClosureBlock = (body, tag) => ({
  head: filterNarrow(body.head, isBlockPrelude),
  tail: {
    type: "ClosureBlock",
    variables: map(filterNarrow(body.head, isDeclarationPrelude), getData),
    statements: body.tail.body,
    completion: body.tail.completion,
    tag,
  },
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeEffectStatement = (inner, tag) => ({
  head: inner.head,
  tail: map(inner.tail, (inner) => ({
    type: "EffectStatement",
    inner,
    tag,
  })),
});

/**
 * @type {(
 *   result: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeReturnStatement = (result, tag) => ({
  head: result.head,
  tail: [
    {
      type: "ReturnStatement",
      result: result.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeDebuggerStatement = (tag) => ({
  head: EMPTY,
  tail: [
    {
      type: "DebuggerStatement",
      tag,
    },
  ],
});

/**
 * @type {(
 *   label: unbuild.Label,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeBreakStatement = (label, tag) => ({
  head: EMPTY,
  tail: [
    {
      type: "BreakStatement",
      label,
      tag,
    },
  ],
});

/**
 * @type {(
 *   do_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeBlockStatement = (do_, tag) => ({
  head: do_.head,
  tail: [
    {
      type: "BlockStatement",
      do: do_.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   if_: import("./sequence").ExpressionSequence,
 *   then_: import("./sequence").ControlBlockSequence,
 *   else_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeIfStatement = (if_, then_, else_, tag) => ({
  head: [...if_.head, ...then_.head, ...else_.head],
  tail: [
    {
      type: "IfStatement",
      if: if_.tail,
      then: then_.tail,
      else: else_.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   try_: import("./sequence").ControlBlockSequence,
 *   catch_: import("./sequence").ControlBlockSequence,
 *   finally_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  head: [...try_.head, ...catch_.head, ...finally_.head],
  tail: [
    {
      type: "TryStatement",
      try: try_.tail,
      catch: catch_.tail,
      finally: finally_.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   while_: import("./sequence").ExpressionSequence,
 *   do_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeWhileStatement = (while_, do_, tag) => ({
  head: [...while_.head, ...do_.head],
  tail: [
    {
      type: "WhileStatement",
      while: while_.tail,
      do: do_.tail,
      tag,
    },
  ],
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeExpressionEffect = (discard, tag) => ({
  head: discard.head,
  tail: [
    {
      type: "ExpressionEffect",
      discard: discard.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   conditional: import("./sequence").ExpressionSequence,
 *   positive: import("./sequence").EffectSequence,
 *   negative: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeConditionalEffect = (condition, positive, negative, tag) => ({
  head: [...condition.head, ...positive.head, ...negative.head],
  tail: [
    {
      type: "ConditionalEffect",
      condition: condition.tail,
      positive: positive.tail,
      negative: negative.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   right: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeWriteEffect = (variable, right, tag) => ({
  head: right.head,
  tail: [
    {
      type: "WriteEffect",
      variable,
      right: right.tail,
      tag,
    },
  ],
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   right: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeExportEffect = (export_, right, tag) => ({
  head: right.head,
  tail: [
    {
      type: "ExportEffect",
      export: export_,
      right: right.tail,
      tag,
    },
  ],
});

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  head: EMPTY,
  tail: {
    type: "PrimitiveExpression",
    primitive,
    tag,
  },
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeImportExpression = (source, import_, tag) => ({
  head: EMPTY,
  tail: {
    type: "ImportExpression",
    source,
    import: import_,
    tag,
  },
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  head: EMPTY,
  tail: {
    type: "IntrinsicExpression",
    intrinsic,
    tag,
  },
});

/**
 * @type {(
 *   variable: aran.Parameter | unbuild.Variable,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeReadExpression = (variable, tag) => ({
  head: EMPTY,
  tail: {
    type: "ReadExpression",
    variable,
    tag,
  },
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeFunctionExpression = (asynchronous, generator, body, tag) => ({
  head: body.head,
  tail: {
    type: "FunctionExpression",
    asynchronous,
    generator,
    body: body.tail,
    tag,
  },
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: false,
 *   body: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeArrowExpression = (asynchronous, _generator, body, tag) => ({
  head: body.head,
  tail: {
    type: "ArrowExpression",
    asynchronous,
    body: body.tail,
    tag,
  },
});

/**
 * @type {(
 *   promise: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeAwaitExpression = (promise, tag) => ({
  head: promise.head,
  tail: {
    type: "AwaitExpression",
    promise: promise.tail,
    tag,
  },
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  head: item.head,
  tail: {
    type: "YieldExpression",
    delegate,
    item: item.tail,
    tag,
  },
});

/**
 * @type {(
 *   head: import("./sequence").EffectSequence,
 *   tail: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeSequenceExpression = (head, tail, tag) => {
  if (head.tail.length === 0) {
    return {
      head: [...head.head, ...tail.head],
      tail: tail.tail,
    };
  } else if (tail.tail.type === "SequenceExpression") {
    return {
      head: [...head.head, ...tail.head],
      tail: {
        type: "SequenceExpression",
        head: [...head.tail, ...tail.tail.head],
        tail: tail.tail.tail,
        tag,
      },
    };
  } else {
    return {
      head: [...head.head, ...tail.head],
      tail: {
        type: "SequenceExpression",
        head: head.tail,
        tail: tail.tail,
        tag,
      },
    };
  }
};

/**
 * @type {(
 *   condition: import("./sequence").ExpressionSequence,
 *   consequent: import("./sequence").ExpressionSequence,
 *   alternate: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeConditionalExpression = (
  condition,
  consequent,
  alternate,
  tag,
) => ({
  head: [...condition.head, ...consequent.head, ...alternate.head],
  tail: {
    type: "ConditionalExpression",
    condition: condition.tail,
    consequent: consequent.tail,
    alternate: alternate.tail,
    tag,
  },
});

/**
 * @type {(
 *   callee: import("./sequence").ExpressionSequence,
 *   this_: import("./sequence").ExpressionSequence,
 *   arguments_: import("./sequence").ExpressionSequence[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  head: [...callee.head, ...this_.head, ...flatMap(arguments_, getHead)],
  tail: {
    type: "ApplyExpression",
    callee: callee.tail,
    this: this_.tail,
    arguments: map(arguments_, getTail),
    tag,
  },
});

/**
 * @type {(
 *   callee: import("./sequence").ExpressionSequence,
 *   arguments_: import("./sequence").ExpressionSequence[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  head: [...callee.head, ...flatMap(arguments_, getHead)],
  tail: {
    type: "ConstructExpression",
    callee: callee.tail,
    arguments: map(arguments_, getTail),
    tag,
  },
});
