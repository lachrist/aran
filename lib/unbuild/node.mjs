import { AranError } from "../error.mjs";
import { compileGet, filterNarrow, flat, map, some } from "../util/index.mjs";
import { makeEarlyErrorStatement } from "./early-error.mjs";
import {
  isBlockPrelude,
  isDeclarationPrelude,
  isEarlyErrorPrelude,
  isEffectPrelude,
  isHeaderPrelude,
  isProgramPrelude,
  isTemplatePrelude,
} from "./prelude.mjs";
import {
  flatSequence,
  mapSequence,
  mapThreeSequence,
  mapTwoSequence,
  sequenceEffect,
  sequenceExpression,
  sequenceStatement,
  zeroSequence,
} from "./sequence.mjs";

const getData = compileGet("data");

/**
 * @type {import("./sequence").EffectSequence}
 */
export const EMPTY_EFFECT = zeroSequence([]);

/**
 * @type {import("./sequence").StatementSequence}
 */
export const EMPTY_STATEMENT = zeroSequence([]);

/**
 * @type {import("./sequence").ControlBodySequence}
 */
export const EMPTY_CONTROL_BODY = zeroSequence({ content: [] });

/////////////
// Program //
/////////////

/**
 * @type {(
 *   sort: import("../sort").Sort,
 *   body: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ProgramSequence}
 */
export const makeProgram = (sort, body, tag) => {
  if (some(body.head, isTemplatePrelude)) {
    throw new AranError("unbound template prelude", { sort, body, tag });
  } else {
    return {
      head: filterNarrow(body.head, isProgramPrelude),
      tail: {
        type: "Program",
        sort,
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
    };
  }
};

//////////
// Body //
//////////

/**
 * @type {(
 *   content: import("./sequence").StatementSequence,
 * ) => import("./sequence").ControlBodySequence}
 */
export const makeControlBody = (content) =>
  mapSequence(sequenceStatement(content), (content) => ({ content }));

/**
 * @type {(
 *   content: import("./sequence").StatementSequence,
 *   completion: import("./sequence").ExpressionSequence,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").NodePrelude,
 *   import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const makeClosureBody = (content, completion) =>
  mapTwoSequence(
    sequenceStatement(content),
    sequenceExpression(completion),
    (content, completion) => ({
      content,
      completion,
    }),
  );

///////////
// Block //
///////////

/**
 * @type {(
 *  labels: unbuild.Label[],
 *  body: import("./sequence").ControlBodySequence,
 *  tag: unbuild.Path,
 * ) => import("./sequence").ControlBlockSequence}
 */
export const makeControlBlock = (labels, body, tag) => ({
  head: filterNarrow(body.head, isBlockPrelude),
  tail: {
    type: "ControlBlock",
    labels,
    variables: map(filterNarrow(body.head, isDeclarationPrelude), getData),
    statements: [
      ...map(
        filterNarrow(body.head, isEffectPrelude),
        ({ data }) =>
          /** @type {aran.Statement<unbuild.Atom>} */ ({
            type: "EffectStatement",
            inner: data,
            tag,
          }),
      ),
      ...body.tail.content,
    ],
    tag,
  },
});

/**
 * @type {(
 *  body: import("./sequence").ClosureBodySequence,
 *  tag: unbuild.Path,
 * ) => import("./sequence").ClosureBlockSequence}
 */
export const makeClosureBlock = (body, tag) => ({
  head: filterNarrow(body.head, isBlockPrelude),
  tail: {
    type: "ClosureBlock",
    variables: map(filterNarrow(body.head, isDeclarationPrelude), getData),
    statements: [
      ...map(
        filterNarrow(body.head, isEffectPrelude),
        ({ data }) =>
          /** @type {aran.Statement<unbuild.Atom>} */ ({
            type: "EffectStatement",
            inner: data,
            tag,
          }),
      ),
      ...body.tail.content,
    ],
    completion: body.tail.completion,
    tag,
  },
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   sequences: import("./sequence").StatementSequence[]
 * ) => import("./sequence").StatementSequence}
 */
export const concatStatement = (sequences) =>
  mapSequence(flatSequence(map(sequences, sequenceStatement)), flat);

/**
 * @type {(
 *   inner: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeEffectStatement = (inner, tag) =>
  mapSequence(sequenceEffect(inner), (inner) =>
    map(inner, (inner) => ({
      type: "EffectStatement",
      inner,
      tag,
    })),
  );

/**
 * @type {(
 *   result: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeReturnStatement = (result, tag) =>
  mapSequence(sequenceExpression(result), (result) => [
    {
      type: "ReturnStatement",
      result,
      tag,
    },
  ]);

/**
 * @type {(
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeDebuggerStatement = (tag) =>
  zeroSequence([
    {
      type: "DebuggerStatement",
      tag,
    },
  ]);

/**
 * @type {(
 *   label: unbuild.Label,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeBreakStatement = (label, tag) =>
  zeroSequence([
    {
      type: "BreakStatement",
      label,
      tag,
    },
  ]);

/**
 * @type {(
 *   do_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeBlockStatement = (do_, tag) =>
  mapSequence(do_, (do_) => [
    {
      type: "BlockStatement",
      do: do_,
      tag,
    },
  ]);

/**
 * @type {(
 *   if_: import("./sequence").ExpressionSequence,
 *   then_: import("./sequence").ControlBlockSequence,
 *   else_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeIfStatement = (if_, then_, else_, tag) =>
  mapThreeSequence(
    sequenceExpression(if_),
    then_,
    else_,
    (if_, then_, else_) => [
      {
        type: "IfStatement",
        if: if_,
        then: then_,
        else: else_,
        tag,
      },
    ],
  );

/**
 * @type {(
 *   try_: import("./sequence").ControlBlockSequence,
 *   catch_: import("./sequence").ControlBlockSequence,
 *   finally_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) =>
  mapThreeSequence(try_, catch_, finally_, (try_, catch_, finally_) => [
    {
      type: "TryStatement",
      try: try_,
      catch: catch_,
      finally: finally_,
      tag,
    },
  ]);

/**
 * @type {(
 *   while_: import("./sequence").ExpressionSequence,
 *   do_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeWhileStatement = (while_, do_, tag) =>
  mapTwoSequence(sequenceExpression(while_), do_, (while_, do_) => [
    {
      type: "WhileStatement",
      while: while_,
      do: do_,
      tag,
    },
  ]);

////////////
// Effect //
////////////

/**
 * @type {(
 *   sequences: import("./sequence").EffectSequence[]
 * ) => import("./sequence").EffectSequence}
 */
export const concatEffect = (sequences) =>
  mapSequence(flatSequence(map(sequences, sequenceEffect)), flat);

/**
 * @type {(
 *   discard: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeExpressionEffect = (discard, tag) =>
  mapSequence(sequenceExpression(discard), (discard) => [
    {
      type: "ExpressionEffect",
      discard,
      tag,
    },
  ]);

/**
 * @type {(
 *   conditional: import("./sequence").ExpressionSequence,
 *   positive: import("./sequence").EffectSequence,
 *   negative: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeConditionalEffect = (condition, positive, negative, tag) =>
  mapThreeSequence(
    sequenceExpression(condition),
    sequenceEffect(positive),
    sequenceEffect(negative),
    (condition, positive, negative) => [
      {
        type: "ConditionalEffect",
        condition,
        positive,
        negative,
        tag,
      },
    ],
  );

/**
 * @type {(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   right: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeWriteEffect = (variable, right, tag) =>
  mapSequence(sequenceExpression(right), (right) => [
    {
      type: "WriteEffect",
      variable,
      right,
      tag,
    },
  ]);

/**
 * @type {(
 *   export_: estree.Specifier,
 *   right: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const makeExportEffect = (export_, right, tag) =>
  mapSequence(sequenceExpression(right), (right) => [
    {
      type: "ExportEffect",
      export: export_,
      right,
      tag,
    },
  ]);

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   primitive: aran.Primitive,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makePrimitiveExpression = (primitive, tag) =>
  zeroSequence({
    type: "PrimitiveExpression",
    primitive,
    tag,
  });

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeImportExpression = (source, import_, tag) =>
  zeroSequence({
    type: "ImportExpression",
    source,
    import: import_,
    tag,
  });

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeIntrinsicExpression = (intrinsic, tag) =>
  zeroSequence({
    type: "IntrinsicExpression",
    intrinsic,
    tag,
  });

/**
 * @type {(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeReadExpression = (variable, tag) =>
  zeroSequence({
    type: "ReadExpression",
    variable,
    tag,
  });

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   block: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeFunctionExpression = (asynchronous, generator, block, tag) =>
  mapSequence(block, (block) => ({
    type: "FunctionExpression",
    asynchronous,
    generator,
    body: block,
    tag,
  }));

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: false,
 *   block: import("./sequence").ClosureBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeArrowExpression = (asynchronous, _generator, block, tag) =>
  mapSequence(block, (block) => ({
    type: "ArrowExpression",
    asynchronous,
    body: block,
    tag,
  }));

/**
 * @type {(
 *   promise: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeAwaitExpression = (promise, tag) =>
  mapSequence(sequenceExpression(promise), (promise) => ({
    type: "AwaitExpression",
    promise,
    tag,
  }));

/**
 * @type {(
 *   delegate: boolean,
 *   item: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeYieldExpression = (delegate, item, tag) =>
  mapSequence(sequenceExpression(item), (item) => ({
    type: "YieldExpression",
    delegate,
    item,
    tag,
  }));

/**
 * @type {(
 *   head: import("./sequence").EffectSequence,
 *   tail: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeSequenceExpression = (head, tail, tag) =>
  mapTwoSequence(
    sequenceEffect(head),
    sequenceExpression(tail),
    (head, tail) => {
      if (head.length === 0) {
        return tail;
      } else if (tail.type === "SequenceExpression") {
        return {
          type: "SequenceExpression",
          head: [...head, ...tail.head],
          tail: tail.tail,
          tag,
        };
      } else {
        return {
          type: "SequenceExpression",
          head,
          tail,
          tag,
        };
      }
    },
  );

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
) =>
  mapThreeSequence(
    sequenceExpression(condition),
    sequenceExpression(consequent),
    sequenceExpression(alternate),
    (condition, consequent, alternate) => ({
      type: "ConditionalExpression",
      condition,
      consequent,
      alternate,
      tag,
    }),
  );

/**
 * @type {(
 *   code: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeEvalExpression = (code, tag) =>
  mapSequence(sequenceExpression(code), (code) => ({
    type: "EvalExpression",
    code,
    tag,
  }));

/**
 * @type {(
 *   callee: import("./sequence").ExpressionSequence,
 *   this_: import("./sequence").ExpressionSequence,
 *   arguments_: import("./sequence").ExpressionSequence[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) =>
  mapThreeSequence(
    sequenceExpression(callee),
    sequenceExpression(this_),
    flatSequence(map(arguments_, sequenceExpression)),
    (callee, this_, arguments_) => ({
      type: "ApplyExpression",
      callee,
      this: this_,
      arguments: arguments_,
      tag,
    }),
  );

/**
 * @type {(
 *   callee: import("./sequence").ExpressionSequence,
 *   arguments_: import("./sequence").ExpressionSequence[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeConstructExpression = (callee, arguments_, tag) =>
  mapTwoSequence(
    sequenceExpression(callee),
    flatSequence(map(arguments_, sequenceExpression)),
    (callee, arguments_) => ({
      type: "ConstructExpression",
      callee,
      arguments: arguments_,
      tag,
    }),
  );
