/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../error.mjs";
import { isHeadfulRoutineBlock, isParameter } from "../../lang/index.mjs";
import {
  flatenTree,
  EMPTY,
  concatXXX,
  concatXXXXX,
  concat_X,
  flatMap,
  isTreeEmpty,
  listValue,
  map,
  mapTree,
} from "../../util/index.mjs";
import { ROOT_DEPTH, incrementDepth } from "../depth.mjs";
import {
  makeProgram,
  makeSegmentBlock,
  makeRoutineBlock,
  makeBlockStatement,
  makeWhileStatement,
  makeYieldExpression,
  makeImportExpression,
  makeEvalExpression,
  makeApplyExpression,
  makeReadExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeSequenceExpression,
  makePrimitiveExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeExportEffect,
  makeWriteEffect,
  makeEffectStatement,
  makeDebuggerStatement,
  makeBreakStatement,
  makeIfStatement,
  makeClosureExpression,
  makeTryStatement,
} from "../node.mjs";
import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleAdviceVariable,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import {
  isClosureKind,
  isProgramKind,
  listParameter,
  makeProgramKind,
} from "../parametrization.mjs";
import {
  trapApplyExpression,
  trapBlockBefore,
  trapBlockDeclaration,
  trapBlockSetup,
  trapBlockTeardown,
  trapBlockThrowing,
  trapConstructExpression,
  trapSegmentBlockAfter,
  trapEffectAfter,
  trapEffectBefore,
  trapEvalExpressionBefore,
  trapExpressionAfter,
  trapExpressionBefore,
  trapStatementAfter,
  trapStatementBefore,
  trapRoutineBlockAfter,
} from "./trap.mjs";
import { CLOSURE_PARENT, SEGMENT_PARENT, toProgramParent } from "./parent.mjs";
import { weaveRoutineHead } from "../prelude.mjs";
import { makeJsonExpression } from "../json.mjs";

/**
 * @type {(
 *   depth: import("../depth").Depth,
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const makeStateBinding = (depth) => [mangleStateVariable(depth), "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const FRAME_BINDING = [FRAME_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const COMPLETION_BINDING = [COMPLETION_VARIABLE, "undefined"];

/**
 * @type {<O extends object, K extends keyof O>(
 *   node: O,
 *   key: K,
 * ) => {
 *   origin: O[K],
 *   parent: O,
 * }}
 */
const drill = (node, key) => ({
  origin: node[key],
  parent: node,
});

/**
 * @type {<X, K extends string, N extends { [key in K]: X[] }>(
 *   node: N,
 *   key: K,
 * ) => {
 *   origin: X,
 *   parent: N,
 * }[]}
 */
const drillArray = (node, key) =>
  map(node[key], (child) => ({
    origin: child,
    parent: node,
  }));

/**
 * @type {<X>(pair: [X, unknown]) => X}
 */
const getPairFirst = ([first, _second]) => first;

/**
 * @type {<X>(pairs: [X, unknown][]) => X[]}
 */
const listPairFirst = (pairs) => map(pairs, getPairFirst);

/////////////
// Program //
/////////////

/**
 * @type {(
 *   target: import("./target").ProgramTarget,
 *   parent: {
 *     initial: import("../../util/util").Json,
 *   },
 *   context: import("./context").Context,
 * ) => import("../atom").ResProgram}
 */
export const weaveProgram = (target, { initial }, context) =>
  makeProgram(
    target.origin.kind,
    target.origin.situ,
    target.origin.head,
    weaveRoutineBlock(
      drill(target.origin, "body"),
      {
        type: "program",
        kind: makeProgramKind(target.origin),
        advice: flatMap(listValue(context.pointcut), listPairFirst),
        initial,
      },
      context,
    ),
    target.origin.tag,
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   entry: [
 *     import("../atom").ArgVariable,
 *     intrinsic: import("../../lang/syntax").Intrinsic,
 *   ],
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const mangleBinding = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const makeAdviceBinding = (variable) => [
  mangleAdviceVariable(variable),
  "undefined",
];

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 *   tag: import("../atom").Tag,
 * ) => import("../atom").ResEffect}
 */
const makeAdviceEffect = (variable, tag) =>
  makeWriteEffect(
    mangleAdviceVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.get", tag),
      makeIntrinsicExpression("undefined", tag),
      [
        makeIntrinsicExpression("globalThis", tag),
        makePrimitiveExpression(variable, tag),
      ],
      tag,
    ),
    tag,
  );

/**
 * @type {(
 *   target: import("./target").SegmentBlockTarget,
 *   parent: import("./parent").SegmentParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResSegmentBlock}
 */
const weaveSegmentBlock = (target, parent, old_context) => {
  const {
    origin: { tag },
  } = target;
  const setup = trapBlockSetup(
    target,
    old_context,
    old_context.pointcut["block@setup"],
  );
  const context = isTreeEmpty(setup)
    ? old_context
    : {
        ...old_context,
        depth: incrementDepth(old_context.depth),
      };
  const declaration = trapBlockDeclaration(
    target,
    context,
    listParameter(parent.kind),
    map(target.origin.bindings, getPairFirst),
    context.pointcut["block@declaration"],
    context.pointcut["block@declaration-overwrite"],
  );
  const bindings = concatXXX(
    isTreeEmpty(setup) ? EMPTY : [makeStateBinding(context.depth)],
    isTreeEmpty(declaration) ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, mangleBinding),
  );
  const body = [
    mapTree(setup, (node) => makeEffectStatement(node, tag)),
    mapTree(declaration, (node) => makeEffectStatement(node, tag)),
    mapTree(
      trapBlockBefore(target, context, context.pointcut["block@before"]),
      (node) => makeEffectStatement(node, tag),
    ),
    map(drillArray(target.origin, "body"), (target) =>
      weaveStatement(target, context),
    ),
    mapTree(
      trapSegmentBlockAfter(
        target,
        context,
        context.pointcut["segment-block@after"],
      ),
      (node) => makeEffectStatement(node, tag),
    ),
  ];
  const throwing = trapBlockThrowing(
    makeReadExpression("catch.error", tag),
    target,
    context,
    context.pointcut["block@throwing"],
  );
  const teardown = trapBlockTeardown(
    target,
    context,
    context.pointcut["block@teardown"],
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    isTreeEmpty(teardown)
  ) {
    return makeSegmentBlock(
      target.origin.labels,
      bindings,
      flatenTree(body),
      tag,
    );
  } else {
    return makeSegmentBlock(
      target.origin.labels,
      bindings,
      [
        makeTryStatement(
          makeSegmentBlock([], [], flatenTree(body), tag),
          makeSegmentBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw", tag),
                    makeIntrinsicExpression("undefined", tag),
                    [throwing],
                    tag,
                  ),
                  tag,
                ),
                tag,
              ),
            ],
            tag,
          ),
          makeSegmentBlock(
            [],
            [],
            mapTree(teardown, (node) => makeEffectStatement(node, tag)),
            tag,
          ),
          tag,
        ),
      ],
      tag,
    );
  }
};

/**
 * @type {(
 *   parent: import("./parent").RoutineParent,
 * ) => "closure" | "program"}
 */
const getRoutineBlockMainKind = (parent) => {
  if (isProgramKind(parent.kind)) {
    return "program";
  } else if (isClosureKind(parent.kind)) {
    return "closure";
  } else {
    throw new AranTypeError(parent.kind);
  }
};

/**
 * @type {(
 *   target: import("./target").RoutineBlockTarget,
 *   parent: import("./parent").RoutineParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (target, parent, old_context) => {
  const {
    origin: { tag },
  } = target;
  const program = toProgramParent(parent);
  const setup = trapBlockSetup(
    target,
    old_context,
    old_context.pointcut["block@setup"],
  );
  const context = isTreeEmpty(setup)
    ? old_context
    : {
        ...old_context,
        depth: incrementDepth(old_context.depth),
      };
  const declaration = trapBlockDeclaration(
    target,
    context,
    listParameter(parent.kind),
    map(target.origin.bindings, getPairFirst),
    context.pointcut["block@declaration"],
    context.pointcut["block@declaration-overwrite"],
  );
  const bindings = concatXXXXX(
    program === null ? EMPTY : map(program.advice, makeAdviceBinding),
    program !== null && old_context.depth === ROOT_DEPTH
      ? [makeStateBinding(ROOT_DEPTH)]
      : EMPTY,
    isTreeEmpty(setup) ? EMPTY : [makeStateBinding(context.depth)],
    isTreeEmpty(declaration) ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, mangleBinding),
  );
  const head = [
    program === null
      ? null
      : map(program.advice, (variable) => makeAdviceEffect(variable, tag)),
    program !== null && old_context.depth === ROOT_DEPTH
      ? makeWriteEffect(
          mangleStateVariable(ROOT_DEPTH),
          makeJsonExpression(program.initial, tag),
          tag,
        )
      : null,
    setup,
    declaration,
    trapBlockBefore(target, context, context.pointcut["block@before"]),
    isHeadfulRoutineBlock(target.origin)
      ? map(drillArray(target.origin, "head"), (target) =>
          weaveEffect(target, context),
        )
      : null,
  ];
  const body = map(drillArray(target.origin, "body"), (target) =>
    weaveStatement(target, context),
  );
  const tail = trapRoutineBlockAfter(
    weaveExpression(drill(target.origin, "tail"), context),
    target,
    context,
    context.pointcut[`${getRoutineBlockMainKind(parent)}-block@after`],
  );
  const throwing = trapBlockThrowing(
    makeReadExpression("catch.error", tag),
    target,
    context,
    context.pointcut["block@throwing"],
  );
  const teardown = trapBlockTeardown(
    target,
    context,
    context.pointcut["block@teardown"],
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    isTreeEmpty(teardown)
  ) {
    return makeRoutineBlock(
      bindings,
      target.origin.head === null ? null : flatenTree(head),
      flatenTree(
        target.origin.head === null
          ? [mapTree(head, (node) => makeEffectStatement(node, tag)), body]
          : body,
      ),
      tail,
      tag,
    );
  } else {
    return makeRoutineBlock(
      concat_X(COMPLETION_BINDING, bindings),
      target.origin.head === null
        ? null
        : flatenTree(weaveRoutineHead(head, throwing, teardown, tag)),
      [
        makeTryStatement(
          makeSegmentBlock(
            [],
            [],
            flatenTree([
              target.origin.head === null
                ? mapTree(head, (node) => makeEffectStatement(node, tag))
                : null,
              body,
              makeEffectStatement(
                makeWriteEffect(COMPLETION_VARIABLE, tail, tag),
                tag,
              ),
            ]),
            tag,
          ),
          makeSegmentBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw", tag),
                    makeIntrinsicExpression("undefined", tag),
                    [throwing],
                    tag,
                  ),
                  tag,
                ),
                tag,
              ),
            ],
            tag,
          ),
          makeSegmentBlock(
            [],
            [],
            mapTree(teardown, (node) => makeEffectStatement(node, tag)),
            tag,
          ),
          tag,
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE, tag),
      tag,
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../../util/tree").Tree<import("../atom").ResStatement>}
 */
const weaveStatement = (target, context) => {
  const {
    origin: { tag },
  } = target;
  return [
    mapTree(
      trapStatementBefore(
        target,
        context,
        context.pointcut["statement@before"],
      ),
      (node) => makeEffectStatement(node, tag),
    ),
    weaveStatementInner(target, context),
    mapTree(
      trapStatementAfter(target, context, context.pointcut["statement@after"]),
      (node) => makeEffectStatement(node, tag),
    ),
  ];
};

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../../util/tree").Tree<import("../atom").ResStatement>}
 */
const weaveStatementInner = ({ origin }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "EffectStatement": {
      return mapTree(weaveEffect(drill(origin, "inner"), context), (node) =>
        makeEffectStatement(node, tag),
      );
    }
    case "DebuggerStatement": {
      return makeDebuggerStatement(tag);
    }
    case "BreakStatement": {
      return makeBreakStatement(origin.label, tag);
    }
    case "BlockStatement": {
      return makeBlockStatement(
        weaveSegmentBlock(drill(origin, "body"), SEGMENT_PARENT.bare, context),
        tag,
      );
    }
    case "IfStatement": {
      return makeIfStatement(
        weaveExpression(drill(origin, "test"), context),
        weaveSegmentBlock(drill(origin, "then"), SEGMENT_PARENT.then, context),
        weaveSegmentBlock(drill(origin, "else"), SEGMENT_PARENT.else, context),
        tag,
      );
    }
    case "WhileStatement": {
      return makeWhileStatement(
        weaveExpression(drill(origin, "test"), context),
        weaveSegmentBlock(drill(origin, "body"), SEGMENT_PARENT.while, context),
        tag,
      );
    }
    case "TryStatement": {
      return makeTryStatement(
        weaveSegmentBlock(drill(origin, "try"), SEGMENT_PARENT.try, context),
        weaveSegmentBlock(
          drill(origin, "catch"),
          SEGMENT_PARENT.catch,
          context,
        ),
        weaveSegmentBlock(
          drill(origin, "finally"),
          SEGMENT_PARENT.finally,
          context,
        ),
        tag,
      );
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};

////////////
// Effect //
////////////

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
const weaveEffect = (target, context) => [
  trapEffectBefore(target, context, context.pointcut["effect@before"]),
  weaveEffectInner(target, context),
  trapEffectAfter(target, context, context.pointcut["effect@after"]),
];

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect}
 */
const weaveEffectInner = ({ origin }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "ExpressionEffect": {
      return makeExpressionEffect(
        weaveExpression(drill(origin, "discard"), context),
        tag,
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        weaveExpression(drill(origin, "test"), context),
        flatenTree(
          map(drillArray(origin, "positive"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        flatenTree(
          map(drillArray(origin, "negative"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        tag,
      );
    }
    case "ExportEffect": {
      return makeExportEffect(
        origin.export,
        weaveExpression(drill(origin, "value"), context),
        tag,
      );
    }
    case "WriteEffect": {
      return makeWriteEffect(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        weaveExpression(drill(origin, "value"), context),
        tag,
      );
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpression = (target, context) =>
  makeSequenceExpression(
    flatenTree(
      trapExpressionBefore(
        target,
        context,
        context.pointcut["expression@before"],
      ),
    ),
    trapExpressionAfter(
      weaveExpressionInner(target, context),
      target,
      context,
      context.pointcut["expression@after"],
    ),
    target.origin.tag,
  );

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpressionInner = ({ origin, parent }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "PrimitiveExpression": {
      return makePrimitiveExpression(origin.primitive, tag);
    }
    case "IntrinsicExpression": {
      return makeIntrinsicExpression(origin.intrinsic, tag);
    }
    case "ReadExpression": {
      return makeReadExpression(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        tag,
      );
    }
    case "ClosureExpression": {
      /** @type {import("../parametrization").ClosureKind} */
      const kind = origin.asynchronous ? `async-${origin.kind}` : origin.kind;
      return makeClosureExpression(
        origin.kind,
        origin.asynchronous,
        weaveRoutineBlock(drill(origin, "body"), CLOSURE_PARENT[kind], context),
        tag,
      );
    }
    case "ImportExpression": {
      return makeImportExpression(origin.source, origin.import, tag);
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        weaveExpression(drill(origin, "promise"), context),
        tag,
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        origin.delegate,
        weaveExpression(drill(origin, "item"), context),
        tag,
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        flatenTree(
          map(drillArray(origin, "head"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        weaveExpression({ origin: origin.tail, parent: origin }, context),
        tag,
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        weaveExpression(drill(origin, "test"), context),
        weaveExpression(drill(origin, "consequent"), context),
        weaveExpression(drill(origin, "alternate"), context),
        tag,
      );
    }
    case "EvalExpression": {
      return makeEvalExpression(
        trapEvalExpressionBefore(
          weaveExpression(drill(origin, "code"), context),
          { origin, parent },
          context,
          context.pointcut["eval@before"],
        ),
        tag,
      );
    }
    case "ApplyExpression": {
      return trapApplyExpression(
        weaveExpression(drill(origin, "callee"), context),
        weaveExpression(drill(origin, "this"), context),
        map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        { origin, parent },
        context,
        context.pointcut["apply@around"],
      );
    }
    case "ConstructExpression": {
      return trapConstructExpression(
        weaveExpression(drill(origin, "callee"), context),
        map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        { origin, parent },
        context,
        context.pointcut["construct@around"],
      );
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};
