import { AranError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  flat,
  flatMap,
  map,
  some,
} from "../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isEarlyErrorPrelude,
  isHeaderPrelude,
  isMetaDeclarationPrelude,
  isNotDeclarationPrelude,
  isProgramPrelude,
  isTemplatePrelude,
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
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => aran.Statement<unbuild.Atom>}
 */
const reportEarlyError = ({ path: tag, message }) => ({
  type: "EffectStatement",
  inner: {
    type: "ExpressionEffect",
    discard: {
      type: "ApplyExpression",
      callee: {
        type: "IntrinsicExpression",
        intrinsic: "aran.throw",
        tag,
      },
      this: {
        type: "PrimitiveExpression",
        primitive: { undefined: null },
        tag,
      },
      arguments: [
        {
          type: "ConstructExpression",
          callee: {
            type: "IntrinsicExpression",
            intrinsic: "SyntaxError",
            tag,
          },
          arguments: [
            {
              type: "PrimitiveExpression",
              primitive: message,
              tag,
            },
          ],
          tag,
        },
      ],
      tag,
    },
    tag,
  },
  tag,
});

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
          frame: body.tail.frame,
          body: [
            ...map(
              map(filterNarrow(body.head, isEarlyErrorPrelude), getData),
              reportEarlyError,
            ),
            ...body.tail.body,
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
 * @type {(
 *   sequences: import("./sequence").ControlBodySequence[]
 * ) => import("./sequence").ControlBodySequence}
 */
export const concatControlBody = (sequences) =>
  mapSequence(flatSequence(sequences), (bodies) => ({
    content: flatMap(bodies, getContent),
  }));

/**
 * @type {(
 *   content: import("./sequence").StatementSequence,
 * ) => import("./sequence").ControlBodySequence}
 */
export const makeControlBody = (content) =>
  mapSequence(content, wrapControlBody);

/**
 * @type {(
 *   content: import("./sequence").StatementSequence,
 *   completion: import("./sequence").ExpressionSequence,
 * ) => import("./sequence").ClosureBodySequence}
 */
export const makeClosureBody = (content, completion) =>
  mapTwoSequence(content, completion, wrapClosureBody);

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
 * @type {(
 *  body: import("./sequence").ClosureBodySequence,
 *  tag: unbuild.Path,
 * ) => import("./sequence").ClosureBlockSequence}
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
 * @type {(
 *   sequences: import("./sequence").StatementSequence[]
 * ) => import("./sequence").StatementSequence}
 */
export const concatStatement = (sequences) =>
  mapSequence(flatSequence(sequences), flat);

/**
 * @type {(
 *   inner: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
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
 * @type {(
 *   result: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
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
 *   body: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
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
 * @type {(
 *   test: import("./sequence").ExpressionSequence,
 *   then_: import("./sequence").ControlBlockSequence,
 *   else_: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
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
 *   test: import("./sequence").ExpressionSequence,
 *   body: import("./sequence").ControlBlockSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
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
 * @type {(
 *   sequences: import("./sequence").EffectSequence[]
 * ) => import("./sequence").EffectSequence}
 */
export const concatEffect = (sequences) =>
  mapSequence(flatSequence(sequences), flat);

/**
 * @type {(
 *   discard: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
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
 * @type {(
 *   test: import("./sequence").ExpressionSequence,
 *   positive: import("./sequence").EffectSequence,
 *   negative: import("./sequence").EffectSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
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
 * @type {(
 *   variable: aran.Parameter | import("./variable").Variable,
 *   value: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
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
 * @type {(
 *   export_: estree.Specifier,
 *   value: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
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
  mapSequence(promise, (promise) => ({
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
  mapSequence(item, (item) => ({
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
 * @type {(
 *   test: import("./sequence").ExpressionSequence,
 *   consequent: import("./sequence").ExpressionSequence,
 *   alternate: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
 * @type {(
 *   code: import("./sequence").ExpressionSequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeEvalExpression = (code, tag) =>
  mapSequence(code, (code) => ({
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
 * @type {(
 *   callee: import("./sequence").ExpressionSequence,
 *   arguments_: import("./sequence").ExpressionSequence[],
 *   tag: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeConstructExpression = (callee, arguments_, tag) =>
  mapTwoSequence(callee, flatSequence(arguments_), (callee, arguments_) => ({
    type: "ConstructExpression",
    callee,
    arguments: arguments_,
    tag,
  }));
