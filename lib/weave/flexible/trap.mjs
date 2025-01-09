import { AranPointcutError } from "../../error.mjs";
import { isParameter } from "../../lang/index.mjs";
import {
  concat_XX,
  map,
  EMPTY,
  reduce,
  filterNarrow,
  isNotNull,
  flatMap,
  compileGet,
  isTreeEmpty,
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
 *   variable: import("estree-sentry").VariableName,
 *   depth: import("../depth").Depth,
 *   input: import("../atom").ResExpression[],
 *   point: import("../../util/util").Json[],
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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
 *       N,
 *     >,
 *   ],
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
 *       N,
 *     >,
 *   ][],
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
const trapAllEffect = (input, target, context, entries) =>
  map(entries, (entry) => trapEffect(input, target, context, entry));

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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
 *       N,
 *     >,
 *   ],
 * ) => null | {
 *   payload: import("../atom").ResExpression,
 *   conflict: import("estree-sentry").VariableName,
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
 *   name: "apply@around" | "construct@around" | "eval@before",
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
 *     import("estree-sentry").VariableName,
 *     import("./aspect").GenericPointcut<
 *       import("../../hash").Hash,
 *       import("../../util/util").Json[],
 *       N,
 *     >,
 *   ][],
 * ) => null | import("../atom").ResExpression}
 */
const trapAllConflict = (name, input, target, context, entries) => {
  const results = filterNarrow(
    map(entries, (entry) => trapConflict(input, target, context, entry)),
    isNotNull,
  );
  if (results.length === 0) {
    return null;
  } else if (results.length === 1) {
    return results[0].payload;
  } else {
    throw new AranPointcutError({
      type: "DuplicateCut",
      point: name,
      conflict: map(results, getConflict),
      hash: target.origin.tag,
    });
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
    return null;
  } else {
    return makeWriteEffect(
      mangleStateVariable(incrementDepth(context.depth)),
      setup,
    );
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
 *   parameter: import("../../lang/syntax").Parameter,
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
 *     | import("../../lang/syntax").Parameter
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
 *   parameters: import("../../lang/syntax").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 *   entries2: import("./aspect").OptimalPointcutEntry<
 *     "block@declaration"
 *   >[],
 *   entries1: import("./aspect").OptimalPointcutEntry<
 *     "block@declaration-overwrite"
 *   >[],
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
    isTreeEmpty(declaration1) &&
    declaration2.type === "ReadExpression" &&
    declaration2.variable === FRAME_VARIABLE
  ) {
    return null;
  } else {
    return [
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
    ];
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapBlockBefore = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").RoutineBlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "program-block@after",
 *   >[],
 * ) => import("../atom").ResExpression}
 */
export const trapProgramBlockAfter = trapAllExpression;

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").RoutineBlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "program-block@after" | "closure-block@after",
 *   >[],
 * ) => import("../atom").ResExpression}
 */
export const trapRoutineBlockAfter = trapAllExpression;

/**
 * @type {(
 *   target: import("./target").SegmentBlockTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<
 *     "segment-block@after",
 *   >[],
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapSegmentBlockAfter = (target, context, entries) =>
  trapAllEffect(EMPTY, target, context, entries);

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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
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
 *   target: import("./target").EvalExpressionTarget,
 *   context: {
 *     root: import("../atom").ArgProgram,
 *     depth: import("../depth").Depth,
 *   },
 *   entries: import("./aspect").OptimalPointcutEntry<"eval@before">[],
 * ) => import("../atom").ResExpression}
 */
export const trapEvalExpressionBefore = (code, target, context, entries) => {
  const result = trapAllConflict(
    "eval@before",
    [code],
    target,
    context,
    entries,
  );
  if (result === null) {
    throw new AranPointcutError({
      type: "MissingCut",
      point: "eval@before",
      hash: target.origin.tag,
    });
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
    "apply@around",
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
    "apply@around",
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
