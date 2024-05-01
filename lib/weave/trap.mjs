import { listKey, map } from "../util/index.mjs";

import { isParameter, packPrimitive } from "../lang.mjs";

import { cut } from "./cut.mjs";

import { makeGetExpression } from "./intrinsic.mjs";

import {
  bindVariable,
  makeApplyExpression,
  makeConstructExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeTryStatement,
  makeWriteEffect,
} from "./node.mjs";

import { makeTriggerExpression } from "./trigger.mjs";
import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
} from "./variable.mjs";

const {
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;

/**
 * @type {<S extends Json>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     S
 *   >,
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: import("../../type/advice").Pointcut<S>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: estree.Variable,
 *     },
 *   },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeTrapExpression = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, path, advice);
  } else {
    if (point.type === "apply") {
      return makeApplyExpression(point.callee, point.this, point.arguments);
    } else if (point.type === "construct") {
      return makeConstructExpression(point.callee, point.arguments);
    } else if (point.type === "primitive.after") {
      return makePrimitiveExpression(packPrimitive(point.value));
    } else if (getOwnPropertyDescriptor(point, "value") && "value" in point) {
      return point.value;
    } else {
      return makePrimitiveExpression({ undefined: null });
    }
  }
};

/**
 * @type {<S extends Json>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     S
 *   >,
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: import("../../type/advice").Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => aran.Effect<weave.ResAtom>[]}
 */
export const listTrapEffect = (point, path, { pointcut, advice }) =>
  cut(point, pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, path, advice))]
    : [];

/**
 * @type {<S extends Json>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     S
 *   > & {
 *     type: "closure.enter" | "program.enter" | "block.enter",
 *   },
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: import("../../type/advice").Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => aran.Effect<weave.ResAtom>[]}
 */
export const listEnterTrapEffect = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    const variables = listKey(point.frame);
    const frame = makeTriggerExpression(point, path, advice);
    if (variables.length === 0) {
      return [makeExpressionEffect(frame)];
    } else if (variables.length === 1) {
      const variable = variables[0];
      return [
        makeWriteEffect(
          isParameter(variable) ? variable : mangleOriginalVariable(variable),
          makeGetExpression(frame, makePrimitiveExpression(variables[0])),
        ),
      ];
    } else {
      return [
        bindVariable(makeWriteEffect(FRAME_VARIABLE, frame), [
          FRAME_VARIABLE,
          { type: "intrinsic", intrinsic: "aran.deadzone" },
        ]),
        ...map(variables, (variable) =>
          makeWriteEffect(
            isParameter(variable) ? variable : mangleOriginalVariable(variable),
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
 *     body: aran.Statement<weave.ResAtom>[],
 *     completion: aran.Expression<weave.ResAtom>,
 *   },
 *   points:{
 *     catch: import("../../type/advice").Point<
 *       aran.Expression<weave.ResAtom>,
 *       S
 *     >,
 *     finally: import("../../type/advice").Point<
 *       aran.Expression<weave.ResAtom>,
 *       S
 *     >,
 *   },
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: import("../../type/advice").Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => {
 *   body: aran.Statement<weave.ResAtom>[],
 *   completion: aran.Expression<weave.ResAtom>,
 * }}
 */
export const trapClosureBlock = (input, points, path, { pointcut, advice }) => {
  const triggered = {
    catch: cut(points.catch, pointcut),
    finally: cut(points.finally, pointcut),
  };
  if (triggered.catch || triggered.finally) {
    return {
      body: [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            [
              ...input.body,
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
                        ? makeTriggerExpression(points.catch, path, advice)
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
                      makeTriggerExpression(points.finally, path, advice),
                    ),
                  ),
                ]
              : [],
          ),
        ),
      ],
      completion: bindVariable(makeReadExpression(COMPLETION_VARIABLE), [
        COMPLETION_VARIABLE,
        { type: "intrinsic", intrinsic: "aran.deadzone" },
      ]),
    };
  } else {
    return input;
  }
};

/**
 * @type {<S extends Json>(
 *   statements: aran.Statement<weave.ResAtom>[],
 *   points: {
 *     catch: import("../../type/advice").Point<
 *       aran.Expression<weave.ResAtom>,
 *       S
 *     >,
 *     finally: import("../../type/advice").Point<
 *       aran.Expression<weave.ResAtom>,
 *       S
 *     >,
 *   },
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: import("../../type/advice").Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => aran.Statement<weave.ResAtom>[]}
 */
export const trapControlBlock = (
  statements,
  points,
  path,
  { pointcut, advice },
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
                      ? makeTriggerExpression(points.catch, path, advice)
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
                    makeTriggerExpression(points.finally, path, advice),
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
