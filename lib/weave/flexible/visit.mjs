/* eslint-disable no-use-before-define */

import { AranError, AranPoincutError, AranTypeError } from "../../error.mjs";
import { isParameter } from "../../lang.mjs";
import {
  EMPTY,
  compileGet,
  concatXXX,
  concatX_X,
  concat_X,
  concat_XX,
  concat_X_X,
  filterNarrow,
  flat,
  flatMap,
  hasOwn,
  isNotNull,
  listValue,
  map,
  pairup,
  reduce,
} from "../../util/index.mjs";
import { incrementDepth } from "../depth.mjs";
import { makeJsonExpression } from "../json.mjs";
import {
  makeProgram,
  makeControlBlock,
  makeRoutineBlock,
  makeBlockStatement,
  makeWhileStatement,
  makeReturnStatement,
  makeYieldExpression,
  makeImportExpression,
  makeEvalExpression,
  makeConstructExpression,
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
import { listParameter } from "../parametrization.mjs";
import {
  listRoutineBinding,
  listRoutineStatement,
  makeRoutineKind,
} from "../routine.mjs";

const getConflict = compileGet("conflict");

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
 * @type {<X,Y>(pair: [X, Y]) => X}
 */
const getPairFirst = ([first, _second]) => first;

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const FRAME_ENTRY = [FRAME_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const COMPLETION_ENTRY = [COMPLETION_VARIABLE, "undefined"];

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   depth: import("../depth").Depth,
 *   input: import("../atom").ResExpression[],
 *   point: import("../../json").Json[],
 * ) => import("../atom").ResExpression}
 */
const makeTrapExpression = (variable, depth, input, point) =>
  makeApplyExpression(
    makeReadExpression(
      mangleAdviceVariable(
        /** @type {import("../rename").Rename} */ (
          /** @type {string} */ (variable)
        ),
      ),
    ),
    makeIntrinsicExpression("undefined"),
    concat_XX(
      makeReadExpression(mangleStateVariable(depth)),
      input,
      map(point, makeJsonExpression),
    ),
  );

/////////////
// Program //
/////////////

/**
 * @type {(
 *   entry: [
 *     import("../../estree").Variable,
 *     unknown,
 *   ],
 * ) => [
 *   import("../../estree").Variable,
 *   import("../rename").Rename,
 * ]}
 */
const rename = ([variable]) => [
  variable,
  /** @type {import("../rename").Rename} */ (/** @type {string} */ (variable)),
];

/**
 * @type {(
 *   entries: [
 *     import("../../estree").Variable,
 *     unknown,
 *   ][],
 *  ) => [
 *   import("../../estree").Variable,
 *   import("../rename").Rename,
 * ][]}
 */
const renameAll = (entries) => map(entries, rename);

/**
 * @type {(
 *   target: import("./target").ProgramTarget,
 *   parent: {
 *     initial: import("../../json").Json,
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
        node: target.origin,
        renaming: flatMap(listValue(context.pointcut), renameAll),
        initial,
      },
      context,
    ),
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: import("./context").Context,
 *   entry: import("./aspect").OptimalPointcutEntry<"block@setup">,
 * ) => import("../atom").ResExpression}
 */
const trapBlockSetup = (
  result,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(variable, depth, [result], point);
  }
};

/**
 * @type {(
 *   setup: import("../atom").ResExpression,
 *   context: import("./context").Context,
 * ) => {
 *   frame: [
 *     import("../atom").ResVariable,
 *     import("../../lang").Intrinsic,
 *   ][],
 *   setup: import("../atom").ResEffect[],
 *   context: import("./context").Context,
 * }}
 */
const finalizeSetup = (setup, context) => {
  if (
    setup.type === "ReadExpression" &&
    setup.variable === mangleStateVariable(context.depth)
  ) {
    return { frame: [], setup: [], context };
  } else {
    const next_depth = incrementDepth(context.depth);
    return {
      frame: [[mangleStateVariable(next_depth), "undefined"]],
      setup: [makeWriteEffect(mangleStateVariable(next_depth), setup)],
      context: {
        ...context,
        depth: next_depth,
      },
    };
  }
};

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"block@failure">,
 * ) => import("../atom").ResExpression}
 */
const trapBlockFailure = (
  result,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(variable, depth, [result], point);
  }
};

/**
 * @type {(
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"block@frame">,
 * ) => null | import("../atom").ResEffect}
 */
const trapBlockFrame = (
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(
        variable,
        depth,
        [makeReadExpression(FRAME_VARIABLE)],
        point,
      ),
    );
  }
};

/**
 * @type {<K extends "block@before" | "block@after" | "block@teardown">(
 *   kind: K,
 * ) => (
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<K>,
 * ) => null | import("../atom").ResEffect}
 */
const generateTrapBlock =
  (_kind) =>
  ({ origin, parent }, { root, depth }, [variable, pointcut]) => {
    const point = pointcut(origin, parent, root);
    if (point == null) {
      return null;
    } else {
      return makeExpressionEffect(
        makeTrapExpression(variable, depth, EMPTY, point),
      );
    }
  };

const trapBlockAfter = generateTrapBlock("block@after");

const trapBlockBefore = generateTrapBlock("block@before");

const trapBlockTeardown = generateTrapBlock("block@teardown");

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"block@overframe">,
 * ) => import("../atom").ResExpression}
 */
const trapBlockOverframe = (
  result,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(variable, depth, [result], point);
  }
};

/**
 * @type {(
 *   entry: [
 *     import("../atom").ArgVariable,
 *     intrinsic: import("../../lang").Intrinsic,
 *   ],
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const weaveFrameEntry = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {(
 *   parameter: import("../../lang").Parameter,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeReadExpression(parameter),
];

/**
 * @type {(
 *   variable: import("../atom").ArgVariable,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeVariableEntry = (variable) => [
  makePrimitiveExpression(variable),
  makeReadExpression(mangleOriginalVariable(variable)),
];

/**
 * @type {(
 *   variable: (
 *     | import("../atom").ArgVariable
 *     | import("../../lang").Parameter
 *   ),
 * ) => import("../atom").ResEffect}
 */
const makeOverwriteEffect = (variable) =>
  makeWriteEffect(
    isParameter(variable) ? variable : mangleOriginalVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [makeReadExpression(FRAME_VARIABLE), makePrimitiveExpression(variable)],
    ),
  );

/**
 * @type {(
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   framing: import("../atom").ResEffect[],
 *   overframe: import("../atom").ResExpression,
 * ) => import("../atom").ResEffect[]}
 */
const finalizeFraming = (parameters, variables, framing, overframe) => {
  if (
    framing.length === 0 &&
    overframe.type === "ReadExpression" &&
    overframe.variable === FRAME_VARIABLE
  ) {
    return [];
  } else {
    return concat_X_X(
      makeWriteEffect(
        FRAME_VARIABLE,
        makeApplyExpression(
          makeIntrinsicExpression("aran.createObject"),
          makeIntrinsicExpression("undefined"),
          concat_XX(
            makePrimitiveExpression(null),
            flatMap(parameters, makeParameterEntry),
            flatMap(variables, makeVariableEntry),
          ),
        ),
      ),
      framing,
      makeWriteEffect(FRAME_VARIABLE, overframe),
      map(variables, makeOverwriteEffect),
    );
  }
};

/**
 * @type {(
 *   parameters: import("../../lang").Parameter[],
 *   target: (
 *     | import("./target").ControlBlockTarget
 *     | import("./target").RoutineBlockTarget
 *   ),
 *   context: import("./context").Context,
 * ) => {
 *   context: import("./context").Context,
 *   frame: [
 *     import("../atom").ResVariable,
 *     import("../../lang").Intrinsic,
 *   ][],
 *   before: import("../atom").ResEffect[],
 *   body: import("../atom").ResStatement[],
 *   after: import("../atom").ResEffect[],
 *   failure: import("../atom").ResExpression,
 *   teardown: import("../atom").ResEffect[],
 * }}
 */
const commonBlock = (parameters, target, old_context) => {
  const { context, setup } = finalizeSetup(
    reduce(
      old_context.pointcut["block@setup"],
      (result, entry) => trapBlockSetup(result, target, old_context, entry),
      makeReadExpression(mangleStateVariable(old_context.depth)),
    ),
    old_context,
  );
  const framing = finalizeFraming(
    parameters,
    map(target.origin.frame, getPairFirst),
    filterNarrow(
      map(context.pointcut["block@frame"], (entry) =>
        trapBlockFrame(target, context, entry),
      ),
      isNotNull,
    ),
    reduce(
      context.pointcut["block@overframe"],
      (result, entry) => trapBlockOverframe(result, target, context, entry),
      makeReadExpression(FRAME_VARIABLE),
    ),
  );
  return {
    context,
    frame: concatXXX(
      setup.length === 0
        ? []
        : [
            pairup(
              mangleStateVariable(context.depth),
              /** @type {import("../../lang").Intrinsic} */ ("undefined"),
            ),
          ],
      framing.length === 0 ? [] : [FRAME_ENTRY],
      map(target.origin.frame, weaveFrameEntry),
    ),
    before: concatXXX(
      setup,
      framing,
      filterNarrow(
        map(context.pointcut["block@before"], (entry) =>
          trapBlockBefore(target, context, entry),
        ),
        isNotNull,
      ),
    ),
    body: flatMap(drillArray(target.origin, "body"), (target) =>
      weaveStatement(target, context),
    ),
    after: filterNarrow(
      map(context.pointcut["block@after"], (entry) =>
        trapBlockAfter(target, context, entry),
      ),
      isNotNull,
    ),
    failure: reduce(
      context.pointcut["block@failure"],
      (result, entry) => trapBlockFailure(result, target, context, entry),
      makeReadExpression("catch.error"),
    ),
    teardown: filterNarrow(
      map(context.pointcut["block@teardown"], (entry) =>
        trapBlockTeardown(target, context, entry),
      ),
      isNotNull,
    ),
  };
};

/**
 * @type {(
 *   parameters: import("../../lang").Parameter[],
 *   target: import("./target").ControlBlockTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResControlBlock}
 */
const weaveControlBlock = (parameters, target, context) => {
  const { frame, before, body, after, failure, teardown } = commonBlock(
    parameters,
    target,
    context,
  );
  const main = concatXXX(
    map(before, makeEffectStatement),
    body,
    map(after, makeEffectStatement),
  );
  if (
    failure.type === "ReadExpression" &&
    failure.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeControlBlock(target.origin.labels, frame, [
      makeTryStatement(
        makeControlBlock([], [], main),
        makeControlBlock(
          [],
          [],
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makeIntrinsicExpression("undefined"),
                  [failure],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock([], [], map(teardown, makeEffectStatement)),
      ),
    ]);
  } else {
    return makeControlBlock(target.origin.labels, frame, main);
  }
};

/**
 * @type {(
 *   target: import("./target").RoutineBlockTarget,
 *   routine: import("../routine").Routine,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (target, routine, context) => {
  const {
    context: new_context,
    frame: partial_frame,
    before,
    body,
    after,
    failure,
    teardown,
  } = commonBlock(listParameter(makeRoutineKind(routine)), target, context);
  const frame = concatX_X(
    listRoutineBinding(routine),
    COMPLETION_ENTRY,
    partial_frame,
  );
  const main = concatXXX(
    listRoutineStatement(routine),
    map(before, makeEffectStatement),
    body,
  );
  if (
    failure.type === "ReadExpression" &&
    failure.variable === "catch.error" &&
    teardown.length === 0
  ) {
    if (after.length === 0) {
      return makeRoutineBlock(
        frame,
        main,
        weaveExpression(drill(target.origin, "completion"), new_context),
      );
    } else {
      return makeRoutineBlock(
        frame,
        main,
        makeSequenceExpression(
          concat_X(
            makeWriteEffect(
              COMPLETION_VARIABLE,
              weaveExpression(drill(target.origin, "completion"), new_context),
            ),
            after,
          ),
          makeReadExpression(COMPLETION_VARIABLE),
        ),
      );
    }
  } else {
    return makeRoutineBlock(
      concatX_X(listRoutineBinding(routine), COMPLETION_ENTRY, frame),
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            concatX_X(
              main,
              makeEffectStatement(
                makeWriteEffect(
                  COMPLETION_VARIABLE,
                  weaveExpression(
                    drill(target.origin, "completion"),
                    new_context,
                  ),
                ),
              ),
              map(after, makeEffectStatement),
            ),
          ),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw"),
                    makeIntrinsicExpression("undefined"),
                    [failure],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock([], [], map(teardown, makeEffectStatement)),
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE),
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {<K extends "statement@before" | "statement@after">(
 *   kind: K,
 * ) => (
 *   target: import("./target").StatementTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<K>,
 * ) => null | import("../atom").ResStatement}
 */
const generateTrapStatement =
  (_kind) =>
  ({ origin, parent }, { root, depth }, [variable, pointcut]) => {
    const point = pointcut(origin, parent, root);
    if (point == null) {
      return null;
    } else {
      return makeEffectStatement(
        makeExpressionEffect(makeTrapExpression(variable, depth, EMPTY, point)),
      );
    }
  };

const trapBeforeStatement = generateTrapStatement("statement@before");

const trapAfterStatement = generateTrapStatement("statement@after");

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResStatement[]}
 */
const weaveStatement = (target, context) =>
  concatXXX(
    filterNarrow(
      map(context.pointcut["statement@before"], (entry) =>
        trapBeforeStatement(target, context, entry),
      ),
      isNotNull,
    ),
    weaveStatementInner(target, context),
    filterNarrow(
      map(context.pointcut["statement@after"], (entry) =>
        trapAfterStatement(target, context, entry),
      ),
      isNotNull,
    ),
  );

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResStatement[]}
 */
const weaveStatementInner = ({ origin }, context) => {
  switch (origin.type) {
    case "EffectStatement": {
      return map(
        weaveEffect(drill(origin, "inner"), context),
        makeEffectStatement,
      );
    }
    case "ReturnStatement": {
      return [
        makeReturnStatement(weaveExpression(drill(origin, "result"), context)),
      ];
    }
    case "DebuggerStatement": {
      return [makeDebuggerStatement()];
    }
    case "BreakStatement": {
      return [makeBreakStatement(origin.label)];
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          weaveControlBlock(
            listParameter("bare"),
            drill(origin, "body"),
            context,
          ),
        ),
      ];
    }
    case "IfStatement": {
      return [
        makeIfStatement(
          weaveExpression(drill(origin, "test"), context),
          weaveControlBlock(
            listParameter("then"),
            drill(origin, "then"),
            context,
          ),
          weaveControlBlock(
            listParameter("else"),
            drill(origin, "else"),
            context,
          ),
        ),
      ];
    }
    case "WhileStatement": {
      return [
        makeWhileStatement(
          weaveExpression(drill(origin, "test"), context),
          weaveControlBlock(
            listParameter("while"),
            drill(origin, "body"),
            context,
          ),
        ),
      ];
    }
    case "TryStatement": {
      return [
        makeTryStatement(
          weaveControlBlock(
            listParameter("try"),
            drill(origin, "try"),
            context,
          ),
          weaveControlBlock(
            listParameter("catch"),
            drill(origin, "catch"),
            context,
          ),
          weaveControlBlock(
            listParameter("finally"),
            drill(origin, "finally"),
            context,
          ),
        ),
      ];
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
 * @type {<K extends "effect@before" | "effect@after">(
 *   kind: K,
 * ) => (
 *   target: import("./target").EffectTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<K>,
 * ) => null | import("../atom").ResEffect}
 */
const generateTrapEffect =
  (_kind) =>
  ({ origin, parent }, { root, depth }, [variable, pointcut]) => {
    const point = pointcut(origin, parent, root);
    if (point == null) {
      return null;
    } else {
      return makeExpressionEffect(
        makeTrapExpression(variable, depth, EMPTY, point),
      );
    }
  };

const trapBeforeEffect = generateTrapEffect("effect@before");

const trapAfterEffect = generateTrapEffect("effect@after");

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect[]}
 */
const weaveEffect = (target, context) =>
  concatX_X(
    filterNarrow(
      map(context.pointcut["effect@before"], (entry) =>
        trapBeforeEffect(target, context, entry),
      ),
      isNotNull,
    ),
    weaveEffectInner(target, context),
    filterNarrow(
      map(context.pointcut["effect@after"], (entry) =>
        trapAfterEffect(target, context, entry),
      ),
      isNotNull,
    ),
  );

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect}
 */
const weaveEffectInner = ({ origin }, context) => {
  switch (origin.type) {
    case "ExpressionEffect": {
      return makeExpressionEffect(
        weaveExpression(drill(origin, "discard"), context),
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        weaveExpression(drill(origin, "test"), context),
        flat(
          map(drillArray(origin, "positive"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        flat(
          map(drillArray(origin, "negative"), (target) =>
            weaveEffect(target, context),
          ),
        ),
      );
    }
    case "ExportEffect": {
      return makeExportEffect(
        origin.export,
        weaveExpression(drill(origin, "value"), context),
      );
    }
    case "WriteEffect": {
      return makeWriteEffect(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        weaveExpression(drill(origin, "value"), context),
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
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"expression@before">,
 * ) => import("../atom").ResEffect | null}
 */
const trapExpressionBefore = (
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(variable, depth, EMPTY, point),
    );
  }
};

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").ExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"expression@after">,
 * ) => import("../atom").ResExpression}
 */
const trapExpressionAfter = (
  result,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(variable, depth, [result], point);
  }
};

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpression = (target, context) =>
  makeSequenceExpression(
    filterNarrow(
      map(context.pointcut["expression@before"], (entry) =>
        trapExpressionBefore(target, context, entry),
      ),
      isNotNull,
    ),
    reduce(
      context.pointcut["expression@after"],
      (result, entry) => trapExpressionAfter(result, target, context, entry),
      weaveExpressionInner(target, context),
    ),
  );

/**
 * @type {(
 *   target: import("./target").EvalExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"eval@before">,
 * ) => null | {
 *   conflict: import("../../estree").Variable,
 *   payload: import("../atom").ResExpression
 * }}
 */
const trapEvalExpressionBefore = (
  { code, context, origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return {
      conflict: variable,
      payload: makeTrapExpression(
        variable,
        depth,
        [makeJsonExpression(context), code],
        point,
      ),
    };
  }
};

/**
 * @type {(
 *   target: import("./target").ApplyExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"apply@around">,
 * ) => null | {
 *   conflict: import("../../estree").Variable,
 *   payload: import("../atom").ResExpression,
 * }}
 */
const trapApplyExpression = (
  { callee, self, input, origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return {
      conflict: variable,
      payload: makeTrapExpression(
        variable,
        depth,
        [
          callee,
          self,
          makeApplyExpression(
            makeIntrinsicExpression("Array.of"),
            makeIntrinsicExpression("undefined"),
            input,
          ),
        ],
        point,
      ),
    };
  }
};

/**
 * @type {(
 *   target: import("./target").ConstructExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: import("./aspect").OptimalPointcutEntry<"construct@around">,
 * ) => null | {
 *   conflict: import("../../estree").Variable,
 *   payload: import("../atom").ResExpression,
 * }}
 */
const trapConstructExpression = (
  { callee, input, origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return {
      conflict: variable,
      payload: makeTrapExpression(
        variable,
        depth,
        [
          callee,
          makeApplyExpression(
            makeIntrinsicExpression("Array.of"),
            makeIntrinsicExpression("undefined"),
            input,
          ),
        ],
        point,
      ),
    };
  }
};

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpressionInner = ({ origin, parent }, context) => {
  switch (origin.type) {
    case "PrimitiveExpression": {
      return makePrimitiveExpression(origin.primitive);
    }
    case "IntrinsicExpression": {
      return makeIntrinsicExpression(origin.intrinsic);
    }
    case "ReadExpression": {
      return makeReadExpression(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
      );
    }
    case "ClosureExpression": {
      return makeClosureExpression(
        origin.kind,
        origin.asynchronous,
        origin.generator,
        weaveRoutineBlock(
          drill(origin, "body"),
          {
            type: "closure",
            node: origin,
          },
          context,
        ),
      );
    }
    case "ImportExpression": {
      return makeImportExpression(origin.source, origin.import);
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        weaveExpression(drill(origin, "promise"), context),
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        origin.delegate,
        weaveExpression(drill(origin, "item"), context),
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        flat(
          map(drillArray(origin, "head"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        weaveExpression({ origin: origin.tail, parent: origin }, context),
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        weaveExpression(drill(origin, "test"), context),
        weaveExpression(drill(origin, "consequent"), context),
        weaveExpression(drill(origin, "alternate"), context),
      );
    }
    case "EvalExpression": {
      if (hasOwn(context.reboot, origin.tag)) {
        const target = {
          code: weaveExpression(drill(origin, "code"), context),
          context: {
            ...context.reboot[origin.tag],
            depth: context.depth,
          },
          origin,
          parent,
        };
        const before = filterNarrow(
          map(context.pointcut["eval@before"], (entry) =>
            trapEvalExpressionBefore(target, context, entry),
          ),
          isNotNull,
        );
        if (before.length === 0) {
          return makeApplyExpression(
            makeIntrinsicExpression("aran.throw"),
            makeIntrinsicExpression("undefined"),
            [
              makePrimitiveExpression(
                "eval@before advice is required to support direct eval call",
              ),
            ],
          );
        } else if (before.length === 1) {
          return makeEvalExpression(before[0].payload);
        } else {
          throw new AranPoincutError(map(before, getConflict));
        }
      } else {
        throw new AranError("missing eval context", { node: origin, context });
      }
    }
    case "ApplyExpression": {
      const target = {
        callee: weaveExpression(drill(origin, "callee"), context),
        self: weaveExpression(drill(origin, "this"), context),
        input: map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        origin,
        parent,
      };
      const around = filterNarrow(
        map(context.pointcut["apply@around"], (entry) =>
          trapApplyExpression(target, context, entry),
        ),
        isNotNull,
      );
      if (around.length === 0) {
        return makeApplyExpression(target.callee, target.self, target.input);
      } else if (around.length === 1) {
        return around[0].payload;
      } else {
        throw new AranPoincutError(map(around, getConflict));
      }
    }
    case "ConstructExpression": {
      const target = {
        callee: weaveExpression(drill(origin, "callee"), context),
        input: map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        origin,
        parent,
      };
      const around = filterNarrow(
        map(context.pointcut["construct@around"], (entry) =>
          trapConstructExpression(target, context, entry),
        ),
        isNotNull,
      );
      if (around.length === 0) {
        return makeConstructExpression(target.callee, target.input);
      } else if (around.length === 1) {
        return around[0].payload;
      } else {
        throw new AranPoincutError(map(around, getConflict));
      }
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};
