import { AranExecError, AranTypeError } from "../error.mjs";
import { isDeclareHeader, isModuleHeader } from "./header.mjs";
import { isHeadfulRoutineBlock, isHeadlessRoutineBlock } from "./syntax.mjs";
import { everyNarrow, isEmptyArray, map } from "../util/index.mjs";

/////////////
// Program //
/////////////

/**
 * @type {<A extends import("./syntax").Atom>(
 *   kind: "module" | "script" | "eval",
 *   situ: "global" | "local.deep" | "local.root",
 *   head: import("./header").Header[],
 *   body: import("./syntax").RoutineBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Program<A>}
 */
export const makeProgram = (kind, situ, head, body, tag) => {
  if (isHeadlessRoutineBlock(body)) {
    switch (kind) {
      case "module": {
        if (situ === "global") {
          if (everyNarrow(head, isModuleHeader)) {
            return {
              type: "Program",
              kind,
              situ,
              head,
              body,
              tag,
            };
          } else {
            throw new AranExecError("illegal header in module program", {
              kind,
              situ,
              head,
              body,
            });
          }
        } else if (situ === "local.deep" || situ === "local.root") {
          throw new AranExecError("illegal situ in module program", {
            kind,
            situ,
            head,
            body,
          });
        } else {
          throw new AranTypeError(situ);
        }
      }
      case "script": {
        if (situ === "global") {
          if (everyNarrow(head, isDeclareHeader)) {
            return {
              type: "Program",
              kind,
              situ,
              head,
              body,
              tag,
            };
          } else {
            throw new AranExecError("illegal header in script program", {
              kind,
              situ,
              head,
              body,
            });
          }
        } else if (situ === "local.deep" || situ === "local.root") {
          throw new AranExecError("illegal situ in script program", {
            kind,
            situ,
            head,
            body,
          });
        } else {
          throw new AranTypeError(situ);
        }
      }
      case "eval": {
        switch (situ) {
          case "global": {
            if (everyNarrow(head, isDeclareHeader)) {
              return {
                type: "Program",
                kind,
                situ,
                head,
                body,
                tag,
              };
            } else {
              throw new AranExecError("illegal header in global eval program", {
                kind,
                situ,
                head,
                body,
              });
            }
          }
          case "local.root": {
            if (everyNarrow(head, isDeclareHeader)) {
              return {
                type: "Program",
                kind,
                situ,
                head,
                body,
                tag,
              };
            } else {
              throw new AranExecError(
                "illegal header in local.root eval program",
                {
                  kind,
                  situ,
                  head,
                  body,
                },
              );
            }
          }
          case "local.deep": {
            if (isEmptyArray(head)) {
              return {
                type: "Program",
                kind,
                situ,
                head,
                body,
                tag,
              };
            } else {
              throw new AranExecError(
                "illegal header in local.deep eval program",
                {
                  kind,
                  situ,
                  head,
                  body,
                },
              );
            }
          }
          default: {
            throw new AranTypeError(situ);
          }
        }
      }
      default: {
        throw new AranTypeError(kind);
      }
    }
  } else {
    throw new AranExecError("program body cannot have head", {
      kind,
      situ,
      head,
      body,
    });
  }
};

///////////
// Block //
///////////

/* eslint-disable local/no-impure */
/**
 * @type {<V>(
 *   bindings: [V, import("./syntax").Intrinsic][],
 * ) => [V, import("./syntax").Intrinsic][]}
 */
const reportDuplicateVariable = (bindings) => {
  const { length } = bindings;
  for (let index1 = 0; index1 < length; index1 += 1) {
    const variable = bindings[index1][0];
    for (let index2 = index1 + 1; index2 < length; index2 += 1) {
      if (variable === bindings[index2][0]) {
        throw new AranExecError("duplicate variable", { variable, bindings });
      }
    }
  }
  return bindings;
};
/* eslint-enable local/no-impure */

/**
 * @type {<A extends import("./syntax").Atom>(
 *  labels: A["Label"][],
 *  frame: [A["Variable"], import("./syntax").Intrinsic][],
 *  body: import("./syntax").Statement<A>[],
 *  tag: A["Tag"],
 * ) => import("./syntax").SegmentBlock<A>}
 */
export const makeSegmentBlock = (labels, bindings, body, tag) => ({
  type: "SegmentBlock",
  labels,
  bindings: reportDuplicateVariable(bindings),
  body,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *  frame: [A["Variable"], import("./syntax").Intrinsic][],
 *  head: null | import("./syntax").Effect<A>[],
 *  body: import("./syntax").Statement<A>[],
 *  tail: import("./syntax").Expression<A>,
 *  tag: A["Tag"],
 * ) => import("./syntax").RoutineBlock<A>}
 */
export const makeRoutineBlock = (bindings, head, body, tail, tag) => ({
  type: "RoutineBlock",
  bindings: reportDuplicateVariable(bindings),
  head,
  body,
  tail,
  tag,
});

///////////////
// Statement //
///////////////

/**
 * @type {<A extends import("./syntax").Atom>(
 *   inner: import("./syntax").Effect<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   inners: import("./syntax").Effect<A>[],
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>[]}
 */
export const listEffectStatement = (inners, tag) =>
  map(inners, (inner) => makeEffectStatement(inner, tag));

/**
 * @type {<A extends import("./syntax").Atom>(
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   label: A["Label"],
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   body: import("./syntax").SegmentBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeBlockStatement = (body, tag) => ({
  type: "BlockStatement",
  body,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   test: import("./syntax").Expression<A>,
 *   then_: import("./syntax").SegmentBlock<A>,
 *   else_: import("./syntax").SegmentBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeIfStatement = (test, then_, else_, tag) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   try_: import("./syntax").SegmentBlock<A>,
 *   catch_: import("./syntax").SegmentBlock<A>,
 *   finally_: import("./syntax").SegmentBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   test: import("./syntax").Expression<A>,
 *   body: import("./syntax").SegmentBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Statement<A>}
 */
export const makeWhileStatement = (test, body, tag) => ({
  type: "WhileStatement",
  test,
  body,
  tag,
});

////////////
// Effect //
////////////

/**
 * @type {<A extends import("./syntax").Atom>(
 *   discard: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Effect<A>}
 */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   test: import("./syntax").Expression<A>,
 *   positive: import("./syntax").Effect<A>[],
 *   negative: import("./syntax").Effect<A>[],
 *   tag: A["Tag"],
 * ) => import("./syntax").Effect<A>}
 */
export const makeConditionalEffect = (test, positive, negative, tag) => ({
  type: "ConditionalEffect",
  test,
  positive,
  negative,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   variable: import("./syntax").Parameter | A["Variable"],
 *   value: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Effect<A>}
 */
export const makeWriteEffect = (variable, value, tag) => ({
  type: "WriteEffect",
  variable,
  value,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   export_: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   value: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Effect<A>}
 */
export const makeExportEffect = (export_, value, tag) => ({
  type: "ExportEffect",
  export: export_,
  value,
  tag,
});

////////////////
// Expression //
////////////////

/**
 * @type {<A extends import("./syntax").Atom>(
 *   primitive: import("./syntax").Primitive,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   source: import("estree-sentry").SourceValue,
 *   import_: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   intrinsic: import("./syntax").Intrinsic,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   variable: import("./syntax").Parameter | A["Variable"],
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   kind: import("./syntax").ClosureKind,
 *   asynchronous: boolean,
 *   body: import("./syntax").RoutineBlock<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeClosureExpression = (kind, asynchronous, body, tag) => {
  if (kind === "arrow" || kind === "function" || kind === "method") {
    if (isHeadlessRoutineBlock(body)) {
      return {
        type: "ClosureExpression",
        kind,
        asynchronous,
        body,
        tag,
      };
    } else {
      throw new AranExecError("closure body cannot have head", {
        kind,
        asynchronous,
        body,
      });
    }
  } else if (kind === "generator") {
    if (isHeadfulRoutineBlock(body)) {
      return {
        type: "ClosureExpression",
        kind,
        asynchronous,
        body,
        tag,
      };
    } else {
      throw new AranExecError("closure body cannot have head", {
        kind,
        asynchronous,
        body,
      });
    }
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {<A extends import("./syntax").Atom>(
 *   promise: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   delegate: boolean,
 *   item: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   head: import("./syntax").Effect<A>[],
 *   tail: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeSequenceExpression = (head, tail, tag) => {
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
};

/**
 * @type {<A extends import("./syntax").Atom>(
 *   test: import("./syntax").Expression<A>,
 *   consequent: import("./syntax").Expression<A>,
 *   alternate: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeConditionalExpression = (
  test,
  consequent,
  alternate,
  tag,
) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   code: import("./syntax").Expression<A>,
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   callee: import("./syntax").Expression<A>,
 *   this_: import("./syntax").Expression<A>,
 *   arguments_: import("./syntax").Expression<A>[],
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<A extends import("./syntax").Atom>(
 *   callee: import("./syntax").Expression<A>,
 *   arguments_: import("./syntax").Expression<A>[],
 *   tag: A["Tag"],
 * ) => import("./syntax").Expression<A>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
