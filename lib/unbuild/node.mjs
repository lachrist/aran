import { AranError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  flat,
  flatMap,
  map,
} from "../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isHeaderPrelude,
  isMetaDeclarationPrelude,
  isNotDeclarationPrelude,
  isNotHeaderPrelude,
} from "./prelude.mjs";
import {
  flatSequence,
  mapSequence,
  mapThreeSequence,
  mapTwoSequence,
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

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   bindings: [
 *     import("./variable").Variable,
 *     import("../../type/aran").Isolate,
 *   ][],
 * ) => [
 *     import("./variable").Variable,
 *     import("../../type/aran").Isolate,
 *   ][]}
 */
const reportDuplicateVariable = (bindings) => {
  const { length } = bindings;
  for (let index1 = 0; index1 < length; index1 += 1) {
    const variable = bindings[index1][0];
    for (let index2 = index1 + 1; index2 < length; index2 += 1) {
      if (variable === bindings[index2][0]) {
        throw new AranError("duplicate variable", { variable, bindings });
      }
    }
  }
  return bindings;
};
/* eslint-enable local/no-impure */

/////////////
// Program //
/////////////

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   sort: import("../sort").Sort,
 *   body: import("./sequence").Sequence<
 *     P,
 *     import("../../type/aran").ClosureBlock<unbuild.Atom>,
 *   >,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, import("./prelude").HeaderPrelude>,
 *   import("../../type/aran").Program<unbuild.Atom>,
 * >}
 */
export const makeProgram = (sort, body, tag) => ({
  head: filterNarrow(body.head, isNotHeaderPrelude),
  tail: {
    type: "Program",
    sort,
    head: map(filterNarrow(body.head, isHeaderPrelude), getData),
    body: {
      type: "ClosureBlock",
      frame: body.tail.frame,
      body: body.tail.body,
      completion: body.tail.completion,
      tag: body.tail.tag,
    },
    tag,
  },
});

//////////
// Body //
//////////

const getContent = compileGet("content");

/**
 * @type {<X>(
 *   content: X,
 * ) => { content: X} }
 */
const wrapControlBody = (content) => ({ content });

/**
 * @type {<X, Y>(
 *   content: X,
 *   completion: Y,
 * ) => { content: X, completion: Y} }
 */
const wrapClosureBody = (content, completion) => ({ content, completion });

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   sequences: import("./sequence").Sequence<
 *     P,
 *     import("./body").ControlBody<unbuild.Atom>,
 *   >[],
 * ) => import("./sequence").Sequence<
 *   P,
 *   import("./body").ControlBody<unbuild.Atom>,
 * >}
 */
export const concatControlBody = (sequences) =>
  mapSequence(flatSequence(sequences), (bodies) => ({
    content: flatMap(bodies, getContent),
  }));

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   content: import("./sequence").Sequence<
 *     P,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 * ) => import("./sequence").Sequence<
 *   P,
 *   import("./body").ControlBody<unbuild.Atom>,
 * >}
 */
export const makeControlBody = (content) =>
  mapSequence(content, wrapControlBody);

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 * >(
 *   content: import("./sequence").Sequence<
 *     P1,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 *   completion: import("./sequence").Sequence<
 *     P2,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   P1 | P2,
 *   import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const makeClosureBody = (content, completion) =>
  mapTwoSequence(content, completion, wrapClosureBody);

///////////
// Block //
///////////

/**
 * @type {<P extends import("./prelude").Prelude>(
 *  labels: unbuild.Label[],
 *  body: import("./sequence").Sequence<
 *    P,
 *    import("./body").ControlBody<unbuild.Atom>,
 *  >,
 *  tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, import("./prelude").DeclarationPrelude>,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const makeControlBlock = (labels, body, tag) => ({
  head: filterNarrow(body.head, isNotDeclarationPrelude),
  tail: {
    type: "ControlBlock",
    labels,
    frame: reportDuplicateVariable([
      ...map(filterNarrow(body.head, isMetaDeclarationPrelude), getData),
      ...map(filterNarrow(body.head, isBaseDeclarationPrelude), getData),
    ]),
    body: body.tail.content,
    tag,
  },
});

/**
 * @type {<P extends import("./prelude").Prelude>(
 *  body: import("./sequence").Sequence<
 *    P,
 *    import("./body").ClosureBody<unbuild.Atom>,
 *  >,
 *  tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, import("./prelude").DeclarationPrelude>,
 *   aran.ClosureBlock<unbuild.Atom>,
 * >}
 */
export const makeClosureBlock = (body, tag) => ({
  head: filterNarrow(body.head, isNotDeclarationPrelude),
  tail: {
    type: "ClosureBlock",
    frame: reportDuplicateVariable([
      ...map(filterNarrow(body.head, isMetaDeclarationPrelude), getData),
      ...map(filterNarrow(body.head, isBaseDeclarationPrelude), getData),
    ]),
    body: body.tail.content,
    completion: body.tail.completion,
    tag,
  },
});

///////////////
// Statement //
///////////////

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   sequences: import("./sequence").Sequence<
 *     P,
 *     aran.Statement<unbuild.Atom>[],
 *   >[],
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const concatStatement = (sequences) =>
  mapSequence(flatSequence(sequences), flat);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   inner: import("./sequence").Sequence<
 *     P,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const makeEffectStatement = (inner, tag) =>
  mapSequence(inner, (inner) =>
    map(inner, (inner) => ({
      type: "EffectStatement",
      inner,
      tag,
    })),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   result: import("./sequence").Sequence<
 *     P,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const makeReturnStatement = (result, tag) =>
  mapSequence(result, (result) => [
    {
      type: "ReturnStatement",
      result,
      tag,
    },
  ]);

/**
 * @type {(
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   never,
 *   aran.Statement<unbuild.Atom>[],
 * >}
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
 * ) => import("./sequence").Sequence<
 *   never,
 *   aran.Statement<unbuild.Atom>[],
 * >}
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
 * @type {<P extends import("./prelude").Prelude>(
 *   body: import("./sequence").Sequence<
 *     P,
 *     aran.ControlBlock<unbuild.Atom>,
 *   >,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const makeBlockStatement = (body, tag) =>
  mapSequence(body, (body) => [
    {
      type: "BlockStatement",
      body,
      tag,
    },
  ]);

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 *   P3 extends import("./prelude").Prelude,
 * >(
 *   test: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   then_: import("./sequence").Sequence<P2, aran.ControlBlock<unbuild.Atom>>,
 *   else_: import("./sequence").Sequence<P3, aran.ControlBlock<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2 | P3,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const makeIfStatement = (test, then_, else_, tag) =>
  mapThreeSequence(test, then_, else_, (test, then_, else_) => [
    {
      type: "IfStatement",
      test,
      then: then_,
      else: else_,
      tag,
    },
  ]);

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 *   P3 extends import("./prelude").Prelude,
 * >(
 *   try_: import("./sequence").Sequence<P1, aran.ControlBlock<unbuild.Atom>>,
 *   catch_: import("./sequence").Sequence<P2, aran.ControlBlock<unbuild.Atom>>,
 *   finally_: import("./sequence").Sequence<P3, aran.ControlBlock<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2 | P3,
 *   aran.Statement<unbuild.Atom>[],
 * >}
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
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 * >(
 *   test: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   body: import("./sequence").Sequence<P2, aran.ControlBlock<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const makeWhileStatement = (test, body, tag) =>
  mapTwoSequence(test, body, (test, body) => [
    {
      type: "WhileStatement",
      test,
      body,
      tag,
    },
  ]);

////////////
// Effect //
////////////

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   sequences: import("./sequence").Sequence<P, aran.Effect<unbuild.Atom>[]>[],
 * ) => import("./sequence").Sequence<P, aran.Effect<unbuild.Atom>[]>}
 */
export const concatEffect = (sequences) =>
  mapSequence(flatSequence(sequences), flat);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   discard: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Effect<unbuild.Atom>[]>}
 */
export const makeExpressionEffect = (discard, tag) =>
  mapSequence(discard, (discard) => [
    {
      type: "ExpressionEffect",
      discard,
      tag,
    },
  ]);

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 *   P3 extends import("./prelude").Prelude,
 * >(
 *   test: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   positive: import("./sequence").Sequence<P2, aran.Effect<unbuild.Atom>[]>,
 *   negative: import("./sequence").Sequence<P3, aran.Effect<unbuild.Atom>[]>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2 | P3,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const makeConditionalEffect = (test, positive, negative, tag) =>
  mapThreeSequence(test, positive, negative, (test, positive, negative) => [
    {
      type: "ConditionalEffect",
      test,
      positive,
      negative,
      tag,
    },
  ]);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   value: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Effect<unbuild.Atom>[]>}
 */
export const makeWriteEffect = (variable, value, tag) =>
  mapSequence(value, (value) => [
    {
      type: "WriteEffect",
      variable,
      value,
      tag,
    },
  ]);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   export_: estree.Specifier,
 *   value: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Effect<unbuild.Atom>[]>}
 */
export const makeExportEffect = (export_, value, tag) =>
  mapSequence(value, (value) => [
    {
      type: "ExportEffect",
      export: export_,
      value,
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
 * ) => import("./sequence").Sequence<never, aran.Expression<unbuild.Atom>>}
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
 * ) => import("./sequence").Sequence<never, aran.Expression<unbuild.Atom>>}
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
 * ) => import("./sequence").Sequence<never, aran.Expression<unbuild.Atom>>}
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
 * ) => import("./sequence").Sequence<never, aran.Expression<unbuild.Atom>>}
 */
export const makeReadExpression = (variable, tag) =>
  zeroSequence({
    type: "ReadExpression",
    variable,
    tag,
  });

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: import("./sequence").Sequence<P, aran.ClosureBlock<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>}
 */
export const makeFunctionExpression = (asynchronous, generator, body, tag) =>
  mapSequence(body, (body) => ({
    type: "FunctionExpression",
    asynchronous,
    generator,
    body,
    tag,
  }));

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   asynchronous: boolean,
 *   generator: false,
 *   body: import("./sequence").Sequence<P, aran.ClosureBlock<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>}
 */
export const makeArrowExpression = (asynchronous, _generator, body, tag) =>
  mapSequence(body, (body) => ({
    type: "ArrowExpression",
    asynchronous,
    body,
    tag,
  }));

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   promise: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>}
 */
export const makeAwaitExpression = (promise, tag) =>
  mapSequence(promise, (promise) => ({
    type: "AwaitExpression",
    promise,
    tag,
  }));

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   delegate: boolean,
 *   item: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>}
 */
export const makeYieldExpression = (delegate, item, tag) =>
  mapSequence(item, (item) => ({
    type: "YieldExpression",
    delegate,
    item,
    tag,
  }));

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 * >(
 *   head: import("./sequence").Sequence<P1, aran.Effect<unbuild.Atom>[]>,
 *   tail: import("./sequence").Sequence<P2, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeSequenceExpression = (head, tail, tag) =>
  mapTwoSequence(head, tail, (head, tail) => {
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
  });

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 *   P3 extends import("./prelude").Prelude,
 * >(
 *   test: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   consequent: import("./sequence").Sequence<P2, aran.Expression<unbuild.Atom>>,
 *   alternate: import("./sequence").Sequence<P3, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2 | P3,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeConditionalExpression = (test, consequent, alternate, tag) =>
  mapThreeSequence(
    test,
    consequent,
    alternate,
    (test, consequent, alternate) => ({
      type: "ConditionalExpression",
      test,
      consequent,
      alternate,
      tag,
    }),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   code: import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>,
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<P, aran.Expression<unbuild.Atom>>}
 */
export const makeEvalExpression = (code, tag) =>
  mapSequence(code, (code) => ({
    type: "EvalExpression",
    code,
    tag,
  }));

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 *   P3 extends import("./prelude").Prelude,
 * >(
 *   callee: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   this_: import("./sequence").Sequence<P2, aran.Expression<unbuild.Atom>>,
 *   arguments_: import("./sequence").Sequence<P3, aran.Expression<unbuild.Atom>>[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2 | P3,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) =>
  mapThreeSequence(
    callee,
    this_,
    flatSequence(arguments_),
    (callee, this_, arguments_) => ({
      type: "ApplyExpression",
      callee,
      this: this_,
      arguments: arguments_,
      tag,
    }),
  );

/**
 * @type {<
 *   P1 extends import("./prelude").Prelude,
 *   P2 extends import("./prelude").Prelude,
 * >(
 *   callee: import("./sequence").Sequence<P1, aran.Expression<unbuild.Atom>>,
 *   arguments_: import("./sequence").Sequence<P2, aran.Expression<unbuild.Atom>>[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P1 | P2,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeConstructExpression = (callee, arguments_, tag) =>
  mapTwoSequence(callee, flatSequence(arguments_), (callee, arguments_) => ({
    type: "ConstructExpression",
    callee,
    arguments: arguments_,
    tag,
  }));
