import { AranTypeError } from "../error.mjs";
import { listChild } from "../lang.mjs";
import { filterNarrow, listEntry, map, reduceEntry } from "../util/index.mjs";
import { makeJsonExpression } from "./intrinsic.mjs";

/** @type {weave.Frame} */
const EMPTY_FRAME = [];

/**
 * @type {(
 *   isolate: weave.Isolate,
 * ) => aran.Intrinsic}
 */
const toIntrinsic = (isolate) => {
  switch (isolate.type) {
    case "intrinsic": {
      return isolate.name;
    }
    case "json": {
      return "undefined";
    }
    default: {
      throw new AranTypeError(isolate);
    }
  }
};

/**
 * @type {(
 *   binding: [weave.ResVariable, weave.Isolate],
 * ) => [weave.ResVariable, aran.Intrinsic]}
 */
const toIntrinsicBinding = ([variable, isolate]) => [
  variable,
  toIntrinsic(isolate),
];

/**
 * @type {(
 *   binding: [weave.ResVariable, weave.Isolate],
 * ) => binding is [weave.ResVariable, weave.JsonIsolate]}
 */
const isJsonBinding = (binding) => binding[1].type === "json";

/**
 * @type {(
 *   binding: [weave.ResVariable, weave.JsonIsolate],
 * ) => aran.Statement<weave.ResAtom>}
 */
const initJsonBinding = ([variable, isolate]) => ({
  type: "EffectStatement",
  inner: {
    type: "WriteEffect",
    variable,
    value: makeJsonExpression(isolate.data),
    tag: EMPTY_FRAME,
  },
  tag: EMPTY_FRAME,
});

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: aran.Node<weave.ResAtom>,
 *   variable: weave.ResVariable,
 * ) => boolean}
 */
export const hasFreeVariable = (node, variable) => {
  const todos = [node];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todos[length];
    if (node.type === "ReadExpression" || node.type === "WriteEffect") {
      if (node.variable === variable) {
        return true;
      }
    }
    if (node.type === "ControlBlock" || node.type === "ClosureBlock") {
      for (const binding of node.frame) {
        if (binding[0] === variable) {
          return false;
        }
      }
    }
    for (const child of listChild(node)) {
      todos[length] = child;
      length += 1;
    }
  }
  return false;
};
/* eslint-disable local/no-impure */

/**
 * @type {<N extends aran.Node<weave.ResAtom>>(
 *   node: N,
 *   binding: [weave.ResVariable, weave.Isolate],
 * ) => N}
 */
export const bindVariable = (node, binding) => {
  if (node.type === "ClosureBlock" || node.type === "ControlBlock") {
    return {
      ...node,
      frame: listEntry(
        reduceEntry([...node.frame, toIntrinsicBinding(binding)]),
      ),
      body: isJsonBinding(binding)
        ? [initJsonBinding(binding), ...node.body]
        : node.body,
    };
  } else {
    return {
      ...node,
      tag: [...node.tag, binding],
    };
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   nodes: aran.Node<weave.ResAtom>[],
 * ) => weave.Frame}
 */
const collectFrame = (nodes) => {
  const stack = [...nodes];
  let { length } = stack;
  /** @type {weave.Frame} */
  const frame = [];
  while (length > 0) {
    length -= 1;
    const node = stack[length];
    for (const binding of node.tag) {
      frame[frame.length] = binding;
    }
    for (const child of listChild(node)) {
      if (child.type !== "ControlBlock" && child.type !== "ClosureBlock") {
        stack[length] = child;
        length += 1;
      }
    }
  }
  return frame;
};
/* eslint-enable local/no-impure */

///////////
// Block //
///////////

/**
 * @type {(
 *   frame: [weave.ResVariable, aran.Intrinsic][],
 *   body: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
export const makeClosureBlock = (frame1, body, completion) => {
  const frame2 = collectFrame([...body, completion]);
  return {
    type: "ClosureBlock",
    frame: listEntry(
      reduceEntry([...frame1, ...map(frame2, toIntrinsicBinding)]),
    ),
    body: [
      ...map(filterNarrow(frame2, isJsonBinding), initJsonBinding),
      ...body,
    ],
    completion,
    tag: EMPTY_FRAME,
  };
};

/**
 * @type {(
 *   labels: weave.Label[],
 *   frame: [weave.ResVariable, aran.Intrinsic][],
 *   body: aran.Statement<weave.ResAtom>[],
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
export const makeControlBlock = (labels, frame1, body) => {
  const frame2 = collectFrame(body);
  return {
    type: "ControlBlock",
    labels,
    frame: listEntry(
      reduceEntry([...frame1, ...map(frame2, toIntrinsicBinding)]),
    ),
    body: [
      ...map(filterNarrow(frame2, isJsonBinding), initJsonBinding),
      ...body,
    ],
    tag: EMPTY_FRAME,
  };
};

/////////////
// Program //
/////////////

/**
 * @type {(
 *   sort: import("../sort").Sort,
 *   head: import("../header").Header[],
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const makeProgram = (sort, head, body) => ({
  type: "Program",
  sort,
  head,
  body,
  tag: EMPTY_FRAME,
});

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   inner: aran.Effect<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   result: aran.Expression<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeReturnStatement = (result) => ({
  type: "ReturnStatement",
  result,
  tag: EMPTY_FRAME,
});

/** @type {() => aran.Statement<weave.ResAtom>} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
  tag: EMPTY_FRAME,
});

/** @type {(label: weave.Label) => aran.Statement<weave.ResAtom>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   body: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   test: aran.Expression<weave.ResAtom>,
 *   then_: aran.ControlBlock<weave.ResAtom>,
 *   else_: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeIfStatement = (test, then_, else_) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   try_: aran.ControlBlock<weave.ResAtom>,
 *   catch_: aran.ControlBlock<weave.ResAtom>,
 *   finally_: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeTryStatement = (try_, catch_, finally_) => ({
  type: "TryStatement",
  try: try_,
  catch: catch_,
  finally: finally_,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   test: aran.Expression<weave.ResAtom>,
 *   body: aran.ControlBlock<weave.ResAtom>,
 * ) => aran.Statement<weave.ResAtom>}
 */
export const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
  tag: EMPTY_FRAME,
});

////////////
// Effect //
////////////

/**
 * @type {(
 *   discard: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   test: aran.Expression<weave.ResAtom>,
 *   positive: aran.Effect<weave.ResAtom>[],
 *   negative: aran.Effect<weave.ResAtom>[],
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeConditionalEffect = (test, positive, negative) => ({
  type: "ConditionalEffect",
  test,
  positive,
  negative,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   variable: aran.Parameter | weave.ResVariable,
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteEffect = (variable, value) => ({
  type: "WriteEffect",
  variable,
  value,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   export_: estree.Specifier,
 *   value: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeExportEffect = (export_, value) => ({
  type: "ExportEffect",
  export: export_,
  value,
  tag: EMPTY_FRAME,
});

////////////////
// Expression //
////////////////

/** @type {(primitive: aran.Primitive) => aran.Expression<weave.ResAtom>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   source: estree.Source,
 *   import_: estree.Specifier | null,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
  tag: EMPTY_FRAME,
});

/** @type {(intrinsic: aran.Intrinsic) => aran.Expression<weave.ResAtom>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   variable: aran.Parameter | weave.ResVariable,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeFunctionExpression = (asynchronous, generator, body) => ({
  type: "FunctionExpression",
  asynchronous,
  generator,
  body,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   body: aran.ClosureBlock<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeArrowExpression = (asynchronous, body) => ({
  type: "ArrowExpression",
  asynchronous,
  body,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   promise: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeAwaitExpression = (promise) => ({
  type: "AwaitExpression",
  promise,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   delegate: boolean,
 *   item: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeYieldExpression = (delegate, item) => ({
  type: "YieldExpression",
  delegate,
  item,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   head: aran.Effect<weave.ResAtom>[],
 *   tail: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeSequenceExpression = (head, tail) => ({
  type: "SequenceExpression",
  head,
  tail,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   test: aran.Expression<weave.ResAtom>,
 *   consequent: aran.Expression<weave.ResAtom>,
 *   alternate: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   code: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeEvalExpression = (code) => ({
  type: "EvalExpression",
  code,
  tag: code.tag,
});

/**
 * @type {(
 *   callee: aran.Expression<weave.ResAtom>,
 *   this_: aran.Expression<weave.ResAtom>,
 *   arguments_: aran.Expression<weave.ResAtom>[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
  tag: EMPTY_FRAME,
});

/**
 * @type {(
 *   callee: aran.Expression<weave.ResAtom>,
 *   arguments_: aran.Expression<weave.ResAtom>[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
  tag: EMPTY_FRAME,
});
