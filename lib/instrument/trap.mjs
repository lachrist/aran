import { packPrimitive } from "../node.mjs";

import { hasOwn, map } from "../util/index.mjs";

import { cut } from "./cut.mjs";

import { makeGetExpression } from "./intrinsic.mjs";

import {
  makeWriteEffect,
  makeApplyExpression,
  makeConstructExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeTryStatement,
  makeReadExpression,
} from "./node.mjs";

import { makeTriggerExpression } from "./trigger.mjs";

import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
} from "./variable.mjs";

/**
 * @template S
 * @typedef {import("./advice.d.ts").Point<S>} Point
 */

/**
 * @template S
 * @typedef {import("./advice.d.ts").Pointcut<S>} Pointcut
 */

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: weave.Expression,
 *     inline: boolean,
 *   },
 * ) => weave.Expression}
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
 *   point: Point<S>,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: weave.Expression,
 *     inline: boolean,
 *   },
 * ) => weave.Effect[]}
 */
export const listTrapEffect = (point, options) =>
  cut(point, options.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, options))]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S> & { type: "closure.enter" | "program.enter" | "block.enter" },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: weave.Expression,
 *     inline: boolean,
 *   },
 * ) => weave.Effect[]}
 */
export const listEnterTrapEffect = (point, options) => {
  if (cut(point, options.pointcut)) {
    const variables = /** @type {unbuild.Variable[]} */ (listKey(point.frame));
    const frame = makeTriggerExpression(point, options);
    if (variables.length === 0) {
      return [makeExpressionEffect(frame)];
    } else if (variables.length === 1) {
      return [
        makeWriteEffect(
          mangleOriginalVariable(variables[0]),
          makeGetExpression(frame, makePrimitiveExpression(variables[0])),
        ),
      ];
    } else {
      return [
        makeWriteEffect(FRAME_VARIABLE, frame),
        ...map(variables, (variable) =>
          makeWriteEffect(
            mangleOriginalVariable(variables[0]),
            makeGetExpression(
              makeReadExpression(FRAME_VARIABLE),
              makePrimitiveExpression(variable),
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
 *     statements: weave.Statement[],
 *     completion: weave.Expression,
 *   },
 *   points:{
 *     catch: Point<S>,
 *     finally: Point<S>,
 *   },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: weave.Expression,
 *     inline: boolean,
 *   },
 * ) => {
 *   statements: weave.Statement[],
 *   completion: weave.Expression,
 * }}
 */
export const trapClosureBlock = (input, points, options) => {
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
              makeEffectStatement(
                makeWriteEffect(COMPLETION_VARIABLE, input.completion),
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
                      triggered.catch
                        ? makeTriggerExpression(points.catch, options)
                        : makeReadExpression("catch.error"),
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
      completion: makeReadExpression(COMPLETION_VARIABLE),
    };
  } else {
    return input;
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   statements: weave.Statement[],
 *   points: {
 *     catch: Point<S>,
 *     finally: Point<S>,
 *   },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: weave.Expression,
 *     inline: boolean,
 *   },
 * ) => weave.Statement[]}
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
                      : makeReadExpression("catch.error"),
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
