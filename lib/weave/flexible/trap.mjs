import { AranPoincutError } from "../../error.mjs";
import { isParameter } from "../../lang.mjs";
import {
  concat_XX,
  map,
  EMPTY,
  reduce,
  filterNarrow,
  isNotNull,
  concat_X_X,
  flatMap,
  compileGet,
} from "../../util/index.mjs";
import { incrementDepth } from "../depth.mjs";
import { makeJsonExpression } from "../json.mjs";
import {
  makeApplyExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import {
  FRAME_VARIABLE,
  mangleAdviceVariable,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";

const getConflict = compileGet("conflict");

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
    makeReadExpression(mangleAdviceVariable(variable)),
    makeIntrinsicExpression("undefined"),
    concat_XX(
      makeReadExpression(mangleStateVariable(depth)),
      input,
      map(point, makeJsonExpression),
    ),
  );

/**
 * @type {<N extends import("../atom").ArgNode>(
 *   input: import("../atom").ResExpression[],
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ],
 * ) => null | import("../atom").ResEffect}
 */
const trapEffect = (
  input,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(variable, depth, input, point),
    );
  }
};

/**
 * @type {<N extends import("../atom").ArgNode>(
 *   input: import("../atom").ResExpression[],
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ][],
 * ) => import("../atom").ResEffect[]}
 */
const trapAllEffect = (input, target, context, entries) =>
  filterNarrow(
    map(entries, (entry) => trapEffect(input, target, context, entry)),
    isNotNull,
  );

/**
 * @type {<N extends import("../atom").ArgNode>(
 *   result: import("../atom").ResExpression,
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ],
 * ) => import("../atom").ResExpression}
 */
const trapExpression = (
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
 * @type {<N extends import("../atom").ArgNode>(
 *   result: import("../atom").ResExpression,
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ][],
 * ) => import("../atom").ResExpression}
 */
const trapAllExpression = (result, target, context, entries) =>
  reduce(
    entries,
    (result, entry) => trapExpression(result, target, context, entry),
    result,
  );

/**
 * @type {<N extends import("../atom").ArgNode>(
 *   input: import("../atom").ResExpression[],
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entry: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ],
 * ) => null | {
 *   payload: import("../atom").ResExpression,
 *   conflict: import("../../estree").Variable,
 * }}
 */
const trapConflict = (
  input,
  { origin, parent },
  { root, depth },
  [variable, pointcut],
) => {
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return {
      conflict: variable,
      payload: makeTrapExpression(variable, depth, input, point),
    };
  }
};

/**
 * @type {<N extends import("../atom").ArgNode>(
 *   input: import("../atom").ResExpression[],
 *   target: {
 *     origin: N,
 *     parent: import("../atom").ArgNode,
 *   },
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: [
 *     import("../../estree").Variable,
 *     import("./aspect").GenericPointcut<
 *       import("../../json").Json[],
 *       N,
 *     >,
 *   ][],
 * ) => null | import("../atom").ResExpression}
 */
const trapAllConflict = (input, target, context, entries) => {
  const results = filterNarrow(
    map(entries, (entry) => trapConflict(input, target, context, entry)),
    isNotNull,
  );
  if (results.length === 0) {
    return null;
  } else if (results.length === 1) {
    return results[0].payload;
  } else {
    throw new AranPoincutError(map(results, getConflict));
  }
};

///////////
// Block //
///////////

/**
 * @type {(
 *   target: import("./target").BlockTarget,
 *   context: import("./context").Context,
 *   entries: import("./aspect").OptimalPointcutEntry<"block@setup">[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockSetup = (target, context, entries) => {
  const state = mangleStateVariable(context.depth);
  const setup = trapAllExpression(
    makeReadExpression(state),
    target,
    context,
    entries,
  );
  if (setup.type === "ReadExpression" && setup.variable === state) {
    return [];
  } else {
    return [
      makeWriteEffect(
        mangleStateVariable(incrementDepth(context.depth)),
        setup,
      ),
    ];
  }
};

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").BlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<"block@throwing">[],
 * ) => import("../atom").ResExpression}
 */
export const trapBlockThrowing = trapAllExpression;

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
 *   target: import("./target").BlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   entries2: import("./aspect").OptimalPointcutEntry<
 *     "block@declaration"
 *   >[],
 *   entries1: import("./aspect").OptimalPointcutEntry<
 *     "block@declaration-overwrite"
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockDeclaration = (
  target,
  context,
  parameters,
  variables,
  entries1,
  entries2,
) => {
  const declaration1 = trapAllEffect(
    [makeReadExpression(FRAME_VARIABLE)],
    target,
    context,
    entries1,
  );
  const declaration2 = trapAllExpression(
    makeReadExpression(FRAME_VARIABLE),
    target,
    context,
    entries2,
  );
  if (
    declaration1.length === 0 &&
    declaration2.type === "ReadExpression" &&
    declaration2.variable === FRAME_VARIABLE
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
      declaration1,
      makeWriteEffect(FRAME_VARIABLE, declaration2),
      map(variables, makeOverwriteEffect),
    );
  }
};

/**
 * @type {(
 *   target: import("./target").BlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "block@before",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockBefore = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   target: import("./target").ControlBlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "control-block@after",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapControlBlockAfter = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: (
 *     | import("./target").RoutineBlockTarget
 *     | import("./target").PreludeBlockTarget
 *   ),
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "routine-block@after",
 *   >[],
 * ) => import("../atom").ResExpression}
 */
export const trapRoutineBlockAfter = trapAllExpression;

/**
 * @type {(
 *   target: import("./target").BlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "block@teardown",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapBlockTeardown = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "statement@before",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapStatementBefore = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "statement@after",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapStatementAfter = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

////////////
// Effect //
////////////

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "effect@before",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapEffectBefore = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "effect@after",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapEffectAfter = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

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
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "expression@after",
 *   >[],
 * ) => import("../atom").ResEffect[]}
 */
export const trapExpressionBefore = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").ExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "expression@after",
 *   >[],
 * ) => import("../atom").ResExpression}
 */
export const trapExpressionAfter = trapAllExpression;

/**
 * @type {(
 *   code: import("../atom").ResExpression,
 *   reboot: import("../../source").DeepLocalContext,
 *   target: import("./target").EvalExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<"eval@before">[],
 * ) => import("../atom").ResExpression}
 */
export const trapEvalExpressionBefore = (
  code,
  reboot,
  target,
  context,
  entries,
) => {
  const result = trapAllConflict(
    [code, makeJsonExpression(reboot)],
    target,
    context,
    entries,
  );
  if (result === null) {
    return makeApplyExpression(
      makeIntrinsicExpression("aran.throw"),
      makeIntrinsicExpression("undefined"),
      [
        makePrimitiveExpression(
          "eval@before advice is required to support direct eval call",
        ),
      ],
    );
  } else {
    return result;
  }
};

/**
 * @type {(
 *   callee: import("../atom").ResExpression,
 *   self: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   target: import("./target").ApplyExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<"apply@around">[],
 * ) => import("../atom").ResExpression}
 */
export const trapApplyExpression = (
  callee,
  self,
  input,
  target,
  context,
  entries,
) => {
  const result = trapAllConflict(
    [
      callee,
      self,
      makeApplyExpression(
        makeIntrinsicExpression("Array.of"),
        makeIntrinsicExpression("undefined"),
        input,
      ),
    ],
    target,
    context,
    entries,
  );
  if (result === null) {
    return makeApplyExpression(callee, self, input);
  } else {
    return result;
  }
};

/**
 * @type {(
 *   callee: import("../atom").ResExpression,
 *   input: import("../atom").ResExpression[],
 *   target: import("./target").ConstructExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<"construct@around">[],
 * ) => import("../atom").ResExpression}
 */
export const trapConstructExpression = (
  callee,
  input,
  target,
  context,
  entries,
) => {
  const result = trapAllConflict(
    [
      callee,
      makeApplyExpression(
        makeIntrinsicExpression("Array.of"),
        makeIntrinsicExpression("undefined"),
        input,
      ),
    ],
    target,
    context,
    entries,
  );
  if (result === null) {
    return makeConstructExpression(callee, input);
  } else {
    return result;
  }
};
