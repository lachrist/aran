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
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<Variable[], S, L, V>,
 *   pointcut: Pointcut<Variable[], S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makers: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 * ) => Expression<Variable[]>}
 */
export const makeTrapExpression = (point, pointcut, advice, makers) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, advice, makers);
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
 *   pointcut: Pointcut<Variable[], S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makers: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 * ) => Effect<Variable[]>[]}
 */
export const listTrapEffect = (point, pointcut, advice, makers) =>
  cut(point, pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, advice, makers))]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<Variable[], S, L, V>,
 *   pointcut: Pointcut<Variable[], S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makers: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 *   parameters: Parameter[],
 *   access: {
 *     makeLoadExpression: (parameter: Parameter | null) => Expression<Variable[]>,
 *     makeSaveEffect: (parameter: Parameter | null, right: Expression<Variable[]>) => Effect<Variable[]>,
 *   }
 * ) => {
 *   statements: Statement<Variable[]>[],
 *   overwritten: {[K in Parameter]: Expression<Variable[]>},
 * }}
 */
export const trapParameter = (
  point,
  pointcut,
  advice,
  makers,
  parameters,
  { makeSaveEffect, makeLoadExpression },
) => {
  const triggered = cut(point, pointcut);
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
    const right = makeTriggerExpression(point, advice, makers);
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
 *   pointcut: Pointcut<Variable[], S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makers: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 *   access: {
 *     makeLoadExpression: () => Expression<Variable[]>,
 *     makeSaveEffect: (right: Expression<Variable[]>) => Effect<Variable[]>,
 *   },
 * ) => {
 *   statements: Statement<Variable[]>[],
 *   completion: Expression<Variable[]>,
 * }}
 */
export const trapClosureBlock = (
  input,
  points,
  pointcut,
  advice,
  makers,
  { makeLoadExpression, makeSaveEffect },
) => {
  const triggered = {
    catch: cut(points.catch, pointcut),
    finally: cut(points.finally, pointcut),
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
                        ? makeTriggerExpression(points.catch, advice, makers)
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
                      makeTriggerExpression(points.finally, advice, makers),
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
 *   pointcut: Pointcut<Variable[], S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makers: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 *   access: {
 *     makeLoadExpression: () => Expression<Variable[]>,
 *     makeSaveEffect: (right: Expression<Variable[]>) => Effect<Variable[]>,
 *   },
 * ) => Statement<Variable[]>[]}
 */
export const tropControlBlock = (
  statements,
  points,
  pointcut,
  advice,
  makers,
) => {
  const triggered = {
    catch: cut(points.catch, pointcut),
    finally: cut(points.finally, pointcut),
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
                      ? makeTriggerExpression(points.catch, advice, makers)
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
                    makeTriggerExpression(points.finally, advice, makers),
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
