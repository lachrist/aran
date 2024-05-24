import { AranError, AranTypeError } from "./error.mjs";
import {
  isLinkHeader,
  isScriptProgramHeader,
  isGlobalEvalProgramHeader,
  isRootLocalEvalProgramHeader,
  isDeepLocalEvalProgramHeader,
} from "./header.mjs";
import { every, map } from "./util/index.mjs";

/////////////
// Program //
/////////////

/**
 * @type {<A extends aran.Atom>(
 *   kind: "module" | "script" | "eval",
 *   situ: "global" | "local.deep" | "local.root",
 *   head: import("./header").Header[],
 *   body: aran.RoutineBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Program<A>}
 */
export const makeProgram = (kind, situ, head, body, tag) => {
  switch (kind) {
    case "module": {
      if (situ === "global") {
        if (every(head, isLinkHeader)) {
          return {
            type: "Program",
            kind,
            situ,
            head,
            body,
            tag,
          };
        } else {
          throw new AranError("illegal header in module program", {
            kind,
            situ,
            head,
            body,
          });
        }
      } else if (situ === "local.deep" || situ === "local.root") {
        throw new AranError("illegal situ in module program", {
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
        if (every(head, isScriptProgramHeader)) {
          return {
            type: "Program",
            kind,
            situ,
            head,
            body,
            tag,
          };
        } else {
          throw new AranError("illegal header in script program", {
            kind,
            situ,
            head,
            body,
          });
        }
      } else if (situ === "local.deep" || situ === "local.root") {
        throw new AranError("illegal situ in script program", {
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
          if (every(head, isGlobalEvalProgramHeader)) {
            return {
              type: "Program",
              kind,
              situ,
              head,
              body,
              tag,
            };
          } else {
            throw new AranError("illegal header in global eval program", {
              kind,
              situ,
              head,
              body,
            });
          }
        }
        case "local.root": {
          if (every(head, isRootLocalEvalProgramHeader)) {
            return {
              type: "Program",
              kind,
              situ,
              head,
              body,
              tag,
            };
          } else {
            throw new AranError("illegal header in local.root eval program", {
              kind,
              situ,
              head,
              body,
            });
          }
        }
        case "local.deep": {
          if (every(head, isDeepLocalEvalProgramHeader)) {
            return {
              type: "Program",
              kind,
              situ,
              head,
              body,
              tag,
            };
          } else {
            throw new AranError("illegal header in local.deep eval program", {
              kind,
              situ,
              head,
              body,
            });
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
};

///////////
// Block //
///////////

/* eslint-disable local/no-impure */
/**
 * @type {<V>(
 *   bindings: [V, aran.Intrinsic][],
 * ) => [V, aran.Intrinsic][]}
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

/**
 * @type {<A extends aran.Atom>(
 *  labels: A["Label"][],
 *  frame: [A["Variable"], aran.Intrinsic][],
 *  body: aran.Statement<A>[],
 *  tag: A["Tag"],
 * ) => aran.ControlBlock<A>}
 */
export const makeControlBlock = (labels, frame, body, tag) => ({
  type: "ControlBlock",
  labels,
  frame: reportDuplicateVariable(frame),
  body,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *  frame: [A["Variable"], aran.Intrinsic][],
 *  body: aran.Statement<A>[],
 *  completion: aran.Expression<A>,
 *  tag: A["Tag"],
 * ) => aran.RoutineBlock<A>}
 */
export const makeClosureBlock = (frame, body, completion, tag) => ({
  type: "ClosureBlock",
  frame: reportDuplicateVariable(frame),
  body,
  completion,
  tag,
});

///////////////
// Statement //
///////////////

/**
 * @type {<A extends aran.Atom>(
 *   inner: aran.Effect<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeEffectStatement = (inner, tag) => ({
  type: "EffectStatement",
  inner,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   inners: aran.Effect<A>[],
 *   tag: A["Tag"],
 * ) => aran.Statement<A>[]}
 */
export const listEffectStatement = (inners, tag) =>
  map(inners, (inner) => makeEffectStatement(inner, tag));

/**
 * @type {<A extends aran.Atom>(
 *   result: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeReturnStatement = (result, tag) => ({
  type: "ReturnStatement",
  result,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeDebuggerStatement = (tag) => ({
  type: "DebuggerStatement",
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   label: A["Label"],
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeBreakStatement = (label, tag) => ({
  type: "BreakStatement",
  label,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   body: aran.ControlBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeBlockStatement = (body, tag) => ({
  type: "BlockStatement",
  body,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   test: aran.Expression<A>,
 *   then_: aran.ControlBlock<A>,
 *   else_: aran.ControlBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeIfStatement = (test, then_, else_, tag) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   try_: aran.ControlBlock<A>,
 *   catch_: aran.ControlBlock<A>,
 *   finally_: aran.ControlBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
 */
export const makeTryStatement = (try_, catch_, finally_, tag) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   test: aran.Expression<A>,
 *   body: aran.ControlBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Statement<A>}
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
 * @type {<A extends aran.Atom>(
 *   discard: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeExpressionEffect = (discard, tag) => ({
  type: "ExpressionEffect",
  discard,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   test: aran.Expression<A>,
 *   positive: aran.Effect<A>[],
 *   negative: aran.Effect<A>[],
 *   tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeConditionalEffect = (test, positive, negative, tag) => ({
  type: "ConditionalEffect",
  test,
  positive,
  negative,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   test: aran.Expression<A>,
 *   positive: aran.Effect<A>[],
 *   negative: aran.Effect<A>[],
 *   tag: A["Tag"],
 * ) => aran.Effect<A>[]}
 */
export const listConditionalEffect = (test, positive, negative, tag) => [
  {
    type: "ConditionalEffect",
    test,
    positive,
    negative,
    tag,
  },
];

/**
 * @type {<A extends aran.Atom>(
 *   variable: aran.Parameter | A["Variable"],
 *   value: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Effect<A>}
 */
export const makeWriteEffect = (variable, value, tag) => ({
  type: "WriteEffect",
  variable,
  value,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   export_: estree.Specifier,
 *   value: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Effect<A>}
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
 * @type {<A extends aran.Atom>(
 *   primitive: aran.Primitive,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makePrimitiveExpression = (primitive, tag) => ({
  type: "PrimitiveExpression",
  primitive,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeImportExpression = (source, import_, tag) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   intrinsic: aran.Intrinsic,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeIntrinsicExpression = (intrinsic, tag) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   variable: aran.Parameter | A["Variable"],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeReadExpression = (variable, tag) => ({
  type: "ReadExpression",
  variable,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   kind: "arrow" | "function",
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.RoutineBlock<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeClosureExpression = (
  kind,
  asynchronous,
  generator,
  body,
  tag,
) => {
  switch (kind) {
    case "arrow": {
      if (generator) {
        throw new AranError("arrow function cannot be generator", {
          kind,
          asynchronous,
          generator,
          body,
          tag,
        });
      } else {
        return {
          type: "ClosureExpression",
          kind,
          asynchronous,
          generator,
          body,
          tag,
        };
      }
    }
    case "function": {
      return {
        type: "ClosureExpression",
        kind,
        asynchronous,
        generator,
        body,
        tag,
      };
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {<A extends aran.Atom>(
 *   promise: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeAwaitExpression = (promise, tag) => ({
  type: "AwaitExpression",
  promise,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   delegate: boolean,
 *   item: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeYieldExpression = (delegate, item, tag) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   head: aran.Effect<A>[],
 *   tail: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   test: aran.Expression<A>,
 *   consequent: aran.Expression<A>,
 *   alternate: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
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
 * @type {<A extends aran.Atom>(
 *   code: aran.Expression<A>,
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeEvalExpression = (code, tag) => ({
  type: "EvalExpression",
  code,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   callee: aran.Expression<A>,
 *   this_: aran.Expression<A>,
 *   arguments_: aran.Expression<A>[],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeApplyExpression = (callee, this_, arguments_, tag) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag,
});

/**
 * @type {<A extends aran.Atom>(
 *   callee: aran.Expression<A>,
 *   arguments_: aran.Expression<A>[],
 *   tag: A["Tag"],
 * ) => aran.Expression<A>}
 */
export const makeConstructExpression = (callee, arguments_, tag) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag,
});
