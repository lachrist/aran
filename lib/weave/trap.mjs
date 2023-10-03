import { hasOwn, map } from "../util/index.mjs";

import { packPrimitive } from "../lang.mjs";

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
 * @template L
 * @typedef {(
 *   import("../../type/advice.js").Point<aran.Expression<weave.ResAtom>, L>
 * )} Point
 */

/**
 * @template S
 * @typedef {import("../../type/advice.js").Pointcut<S>} Pointcut
 */

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: aran.Expression<weave.ResAtom>,
 *     location: "inline" | "extract",
 *   },
 * ) => aran.Expression<weave.ResAtom>}
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
    } else if (hasOwn(point, "value") && "value" in point) {
      return point.value;
    } else {
      return makePrimitiveExpression({ undefined: null });
    }
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: aran.Expression<weave.ResAtom>,
 *     location: "inline" | "extract",
 *   },
 * ) => aran.Effect<weave.ResAtom>[]}
 */
export const listTrapEffect = (point, options) =>
  cut(point, options.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, options))]
    : [];

/**
 * @type {<S extends Json>(
 *   point: Point<S> & { type: "function.enter" | "program.enter" | "block.enter" },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: aran.Expression<weave.ResAtom>,
 *     location: "inline" | "extract",
 *   },
 * ) => aran.Effect<weave.ResAtom>[]}
 */
export const listEnterTrapEffect = (point, options) => {
  if (cut(point, options.pointcut)) {
    const variables = /** @type {weave.ArgVariable[]} */ (
      listKey(point.record)
    );
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
 * @type {<S extends Json>(
 *   input: {
 *     statements: aran.Statement<weave.ResAtom>[],
 *     completion: aran.Expression<weave.ResAtom>,
 *   },
 *   points:{
 *     catch: Point<S>,
 *     finally: Point<S>,
 *   },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: aran.Expression<weave.ResAtom>,
 *     location: "inline" | "extract",
 *   },
 * ) => {
 *   statements: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
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
 * @type {<S extends Json>(
 *   statements: aran.Statement<weave.ResAtom>[],
 *   points: {
 *     catch: Point<S>,
 *     finally: Point<S>,
 *   },
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: aran.Expression<weave.ResAtom>,
 *     location: "inline" | "extract",
 *   },
 * ) => aran.Statement<weave.ResAtom>[]}
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
