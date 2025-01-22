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
  concat_X,
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
 *   tag: import("../atom").Tag,
 * ) => import("../atom").ResExpression}
 */
const makeTrapExpression = (variable, depth, input, point, tag) =>
  makeApplyExpression(
    makeReadExpression(mangleAdviceVariable(variable), tag),
    makeIntrinsicExpression("undefined", tag),
    concat_XX(
      makeReadExpression(mangleStateVariable(depth), tag),
      input,
      map(point, (data) => makeJsonExpression(data, tag)),
    ),
    tag,
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
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
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(variable, depth, input, point, tag),
      tag,
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
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
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(variable, depth, [result], point, tag);
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
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
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return {
      conflict: variable,
      payload: makeTrapExpression(variable, depth, input, point, tag),
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
 *       import("../../util/util").Json[],
 *       import("../atom").ArgAtom,
 *       N,
 *     >,
 *   ][],
 * ) => null | import("../atom").ResExpression}
 */
const trapAllConflict = (name, input, target, context, entries) => {
  const {
    origin: { tag },
  } = target;
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
      tag,
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<"block@setup">[],
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapBlockSetup = (target, context, entries) => {
  const { origin, parent } = target;
  const { tag } = origin;
  const { depth, root } = context;
  const state = mangleStateVariable(depth);
  // Cannot use trapAllExpression because it duplicates state argument.
  const setup = reduce(
    entries,
    (result, { 0: variable, 1: pointcut }) => {
      const point = pointcut(origin, parent, root);
      if (point == null) {
        return result;
      } else {
        return makeApplyExpression(
          makeReadExpression(mangleAdviceVariable(variable), tag),
          makeIntrinsicExpression("undefined", tag),
          concat_X(
            result,
            map(point, (data) => makeJsonExpression(data, tag)),
          ),
          tag,
        );
      }
    },
    makeReadExpression(state, tag),
  );
  if (setup.type === "ReadExpression" && setup.variable === state) {
    return null;
  } else {
    const next_state = mangleStateVariable(incrementDepth(context.depth));
    return makeWriteEffect(next_state, setup, tag);
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<"block@throwing">[],
 * ) => import("../atom").ResExpression}
 */
export const trapBlockThrowing = trapAllExpression;

/**
 * @type {(
 *   parameter: import("../../lang/syntax").Parameter,
 *   tag: import("../atom").Tag,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeParameterEntry = (parameter, tag) => [
  makePrimitiveExpression(parameter, tag),
  makeReadExpression(parameter, tag),
];

/**
 * @type {(
 *   variable: import("../atom").ArgVariable,
 *   tag: import("../atom").Tag,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeVariableEntry = (variable, tag) => [
  makePrimitiveExpression(variable, tag),
  makeReadExpression(mangleOriginalVariable(variable), tag),
];

/**
 * @type {(
 *   variable: (
 *     | import("../atom").ArgVariable
 *     | import("../../lang/syntax").Parameter
 *   ),
 *   tag: import("../atom").Tag,
 * ) => import("../atom").ResEffect}
 */
const makeOverwriteEffect = (variable, tag) =>
  makeWriteEffect(
    isParameter(variable) ? variable : mangleOriginalVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.get", tag),
      makeIntrinsicExpression("undefined", tag),
      [
        makeReadExpression(FRAME_VARIABLE, tag),
        makePrimitiveExpression(variable, tag),
      ],
      tag,
    ),
    tag,
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
 *   entries2: import("./aspect-internal").OptimalPointcutEntry<
 *     "block@declaration"
 *   >[],
 *   entries1: import("./aspect-internal").OptimalPointcutEntry<
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
  const {
    origin: { tag },
  } = target;
  const declaration1 = trapAllEffect(
    [makeReadExpression(FRAME_VARIABLE, tag)],
    target,
    context,
    entries1,
  );
  const declaration2 = trapAllExpression(
    makeReadExpression(FRAME_VARIABLE, tag),
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
          makeIntrinsicExpression("aran.createObject", tag),
          makeIntrinsicExpression("undefined", tag),
          concat_XX(
            makePrimitiveExpression(null, tag),
            flatMap(parameters, (parameter) =>
              makeParameterEntry(parameter, tag),
            ),
            flatMap(variables, (variable) => makeVariableEntry(variable, tag)),
          ),
          tag,
        ),
        tag,
      ),
      declaration1,
      makeWriteEffect(FRAME_VARIABLE, declaration2, tag),
      map(variables, (variable) => makeOverwriteEffect(variable, tag)),
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<"eval@before">[],
 * ) => import("../atom").ResExpression}
 */
export const trapEvalExpressionBefore = (code, target, context, entries) => {
  const {
    origin: { tag },
  } = target;
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
      tag,
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<"apply@around">[],
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
  const {
    origin: { tag },
  } = target;
  const result = trapAllConflict(
    "apply@around",
    [
      callee,
      self,
      makeApplyExpression(
        makeIntrinsicExpression("Array.of", tag),
        makeIntrinsicExpression("undefined", tag),
        input,
        tag,
      ),
    ],
    target,
    context,
    entries,
  );
  if (result === null) {
    return makeApplyExpression(callee, self, input, tag);
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
 *   entries: import("./aspect-internal").OptimalPointcutEntry<"construct@around">[],
 * ) => import("../atom").ResExpression}
 */
export const trapConstructExpression = (
  callee,
  input,
  target,
  context,
  entries,
) => {
  const {
    origin: { tag },
  } = target;
  const result = trapAllConflict(
    "apply@around",
    [
      callee,
      makeApplyExpression(
        makeIntrinsicExpression("Array.of", tag),
        makeIntrinsicExpression("undefined", tag),
        input,
        tag,
      ),
    ],
    target,
    context,
    entries,
  );
  if (result === null) {
    return makeConstructExpression(callee, input, tag);
  } else {
    return result;
  }
};
