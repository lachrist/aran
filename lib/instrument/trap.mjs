import { packPrimitive } from "../syntax.mjs";

import { hasOwn, map } from "../util/index.mjs";

import { cut } from "./cut.mjs";

import { makeGetExpression } from "./intrinsic.mjs";

import {
  makeApplyExpression,
  makeConstructExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeParameterExpression,
  makePrimitiveExpression,
  makeTryStatement,
} from "./syntax.mjs";

import { makeTriggerExpression } from "./trigger.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template S, L, V
 * @typedef {{
 *   pointcut: Pointcut<S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makeSerialExpression: (value: S) => Expression<Variable[]>,
 *   makeLabelExpression: (value: L) => Expression<Variable[]>,
 *   makeVariableExpression: (value: V) => Expression<Variable[]>,
 * }} Options
 */

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<Variable[], S, L, V>,
 *   options: Options<S, L, V>,
 * ) => Expression<Variable[]>}
 */
export const makeTrapExpression = (point, options) => {
  if (cut(point, options.pointcut)) {
    return makeTriggerExpression(point, options);
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
      return makePrimitiveExpression({ undefined: null });
    }
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<Variable[], S, L, V>,
 *   options: Options<S, L, V>,
 * ) => Effect<Variable[]>[]}
 */
export const listTrapEffect = (point, options) =>
  cut(point, options.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, options))]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<Variable[], S, L, V>,
 *   options: Options<S, L, V>,
 *   parameters: Parameter[],
 *   access: {
 *     makeSaveEffect: (parameter: Parameter | null, right: Expression<Variable[]>) => Effect<Variable[]>,
 *     makeLoadExpression: (parameter: Parameter | null) => Expression<Variable[]>,
 *   },
 * ) => {
 *   statements: Statement<Variable[]>[],
 *   overwritten: {[K in Parameter]: Expression<Variable[]>},
 * }}
 */
export const trapParameter = (
  point,
  options,
  parameters,
  { makeSaveEffect, makeLoadExpression },
) => {
  const triggered = cut(point, options.pointcut);
  const overwritten =
    /** @type {{[K in Parameter]: Expression<Variable[]>}} */ (
      reduceEntry(
        map(parameters, (parameter) => [
          parameter,
          triggered
            ? makeParameterExpression(parameter)
            : makeLoadExpression(parameter),
        ]),
      )
    );
  if (triggered) {
    const right = makeTriggerExpression(point, options);
    if (parameters.length === 0) {
      return {
        statements: [makeEffectStatement(makeExpressionEffect(right))],
        overwritten,
      };
    } else if (parameters.length === 1) {
      const parameter = parameters[0];
      return {
        statements: [
          makeEffectStatement(
            makeSaveEffect(
              parameter,
              makeGetExpression(right, makePrimitiveExpression(parameter)),
            ),
          ),
        ],
        overwritten,
      };
    } else {
      return {
        statements: [
          makeEffectStatement(makeSaveEffect(null, right)),
          ...map(parameters, (parameter) =>
            makeEffectStatement(
              makeSaveEffect(
                parameter,
                makeGetExpression(
                  makeLoadExpression(null),
                  makePrimitiveExpression(parameter),
                ),
              ),
            ),
          ),
        ],
        overwritten,
      };
    }
  } else {
    return {
      statements: [],
      overwritten,
    };
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   input: {
 *     statements: Statement<Variable[]>[],
 *     completion: Expression<Variable[]>,
 *   },
 *   points:{
 *     catch: Point<Variable[], S, L, V>,
 *     finally: Point<Variable[], S, L, V>,
 *   },
 *   options: Options<S, L, V>,
 *   access: {
 *     makeSaveEffect: (right: Expression<Variable[]>) => Effect<Variable[]>,
 *     makeLoadExpression: () => Expression<Variable[]>,
 *   },
 * ) => {
 *   statements: Statement<Variable[]>[],
 *   completion: Expression<Variable[]>,
 * }}
 */
export const trapClosureBlock = (
  input,
  points,
  options,
  { makeLoadExpression, makeSaveEffect },
) => {
  const triggered = {
    catch: cut(points.catch, options.pointcut),
    finally: cut(points.finally, options.pointcut),
  };
  if (triggered.catch || triggered.finally) {
    return {
      statements: [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            [
              ...input.statements,
              makeEffectStatement(makeSaveEffect(input.completion)),
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
                      triggered.catch
                        ? makeTriggerExpression(points.catch, options)
                        : makeParameterExpression("catch.error"),
                    ],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            triggered.finally
              ? [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeTriggerExpression(points.finally, options),
                    ),
                  ),
                ]
              : [],
          ),
        ),
      ],
      completion: makeLoadExpression(),
    };
  } else {
    return input;
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   statements: Statement<Variable[]>[],
 *   points:{
 *     catch: Point<Variable[], S, L, V>,
 *     finally: Point<Variable[], S, L, V>,
 *   },
 *   options: Options<S, L, V>,
 * ) => Statement<Variable[]>[]}
 */
export const trapControlBlock = (statements, points, options) => {
  const triggered = {
    catch: cut(points.catch, options.pointcut),
    finally: cut(points.finally, options.pointcut),
  };
  if (triggered.catch || triggered.finally) {
    return [
      makeTryStatement(
        makeControlBlock([], [], statements),
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
                    triggered.catch
                      ? makeTriggerExpression(points.catch, options)
                      : makeParameterExpression("catch.error"),
                  ],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock(
          [],
          [],
          triggered.finally
            ? [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeTriggerExpression(points.finally, options),
                  ),
                ),
              ]
            : [],
        ),
      ),
    ];
  } else {
    return statements;
  }
};
