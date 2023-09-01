import {
  makeIntrinsicExpression,
  makeParameterExpression,
  makeTryStatement,
  packPrimitive,
} from "../syntax.mjs";
import { DynamicError, hasOwn, map } from "../util/index.mjs";
import { cut } from "./cut.mjs";
import { makeGetExpression } from "./intrinsic.mjs";
import {
  makeLayerClosureBlock,
  makeLayerControlBlock,
  makeNewReadExpression,
  makeNewWriteEffect,
} from "./layer.mjs";
import {
  makeApplyExpression,
  makeConstructExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "./syntax.mjs";
import { makeTriggerExpression } from "./trigger.mjs";
import { COMPLETION_VARIABLE, mangleParameterVariable } from "./variable.mjs";

const { undefined } = globalThis;

/**
 * @template {Json} S
 * @template {Json} L
 * @template {Json} V
 * @typedef {{
 *   pointcut: Pointcut<S, L, V>,
 *   advice: string,
 *   inline: { label: boolean, serial: boolean, variable: boolean },
 *   stringifyLabel: (variable: L) => string,
 *   stringifyVariable: (variable: V) => string,
 * }} Context
 */

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Expression<Usage>}
 */
export const makeTrapExpression = (point, path, context) => {
  if (cut(point, context.pointcut)) {
    return makeTriggerExpression(point, path, context);
  } else {
    if (point.type === "apply") {
      return makeApplyExpression(point.callee, point.this, point.arguments);
    } else if (point.type === "construct") {
      return makeConstructExpression(point.callee, point.arguments);
    } else if (point.type === "primitive.after") {
      return makePrimitiveExpression(packPrimitive(point.value));
    } else if (hasOwn(point, "value")) {
      return point.value;
    } else {
      throw new DynamicError("invalid expression point", point);
    }
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Effect<Usage>[]}
 */
export const listTrapEffect = (point, path, context) =>
  cut(point, context.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, path, context))]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Statement<Usage>[]}
 */
export const listTrapStatement = (point, path, context) =>
  cut(point, context.pointcut)
    ? [
        makeEffectStatement(
          makeExpressionEffect(makeTriggerExpression(point, path, context)),
        ),
      ]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 *   parameters: Parameter[],
 * ) => Statement<Usage>[]}
 */
export const listParameterTrapStatement = (
  point,
  path,
  context,
  parameters,
) => {
  if (cut(point, context.pointcut)) {
    const right = makeTriggerExpression(point, path, context);
    if (parameters.length === 0) {
      return [makeEffectStatement(makeExpressionEffect(right))];
    } else if (parameters.length === 1) {
      const parameter = parameters[0];
      return [
        makeEffectStatement(
          makeNewWriteEffect(
            mangleParameterVariable(parameter),
            makeGetExpression(right, makePrimitiveExpression(parameter)),
            undefined,
          ),
        ),
      ];
    } else {
      return [
        makeEffectStatement(
          makeNewWriteEffect(mangleParameterVariable(null), right, undefined),
        ),
        ...map(parameters, (parameter) =>
          makeEffectStatement(
            makeNewWriteEffect(
              mangleParameterVariable(parameter),
              makeGetExpression(
                makeNewReadExpression(mangleParameterVariable(null), undefined),
                makePrimitiveExpression(parameter),
              ),
              undefined,
            ),
          ),
        ),
      ];
    }
  } else {
    return [];
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   input: {
 *     labels: string[],
 *     variables: string[],
 *     statements: Statement<Usage>[],
 *   },
 *   points:{
 *     catch: Point<S, L, V>,
 *     finally: Point<S, L, V>,
 *   },
 *   path: string,
 *   context: Context<S, L, V>
 * ) => ControlBlock<Usage>}
 */
export const makeTrapControlBlock = (input, points, path, context) => {
  const cuts = {
    catch: cut(points.catch, context.pointcut),
    finally: cut(points.finally, context.pointcut),
  };
  if (cuts.catch || cuts.finally) {
    return makeLayerControlBlock(input.labels, input.variables, [
      makeTryStatement(
        makeControlBlock([], [], input.statements),
        makeControlBlock(
          [],
          [],
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    cuts.catch
                      ? makeTriggerExpression(points.catch, path, context)
                      : makeParameterExpression("error"),
                  ],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock(
          [],
          [],
          cuts.finally
            ? [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeTriggerExpression(points.finally, path, context),
                  ),
                ),
              ]
            : [],
        ),
      ),
    ]);
  } else {
    return makeLayerControlBlock(
      input.labels,
      input.variables,
      input.statements,
    );
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   input: {
 *     variables: string[],
 *     statements: Statement<Usage>[],
 *     completion: Expression<Usage>,
 *   },
 *   points:{
 *     catch: Point<S, L, V>,
 *     finally: Point<S, L, V>,
 *   },
 *   path: string,
 *   context: Context<S, L, V>
 * ) => ClosureBlock<Usage>}
 */
export const makeTrapClosureBlock = (input, points, path, context) => {
  const cuts = {
    catch: cut(points.catch, context.pointcut),
    finally: cut(points.finally, context.pointcut),
  };
  if (cuts.catch || cuts.finally) {
    return makeLayerClosureBlock(
      input.variables,
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            [
              ...input.statements,
              makeEffectStatement(
                makeNewWriteEffect(
                  COMPLETION_VARIABLE,
                  input.completion,
                  undefined,
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw"),
                    makePrimitiveExpression({ undefined: null }),
                    [
                      cuts.catch
                        ? makeTriggerExpression(points.catch, path, context)
                        : makeParameterExpression("error"),
                    ],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            cuts.finally
              ? [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeTriggerExpression(points.finally, path, context),
                    ),
                  ),
                ]
              : [],
          ),
        ),
      ],
      makeNewReadExpression(COMPLETION_VARIABLE, undefined),
    );
  } else {
    return makeLayerClosureBlock(
      input.variables,
      input.statements,
      input.completion,
    );
  }
};
