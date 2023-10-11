import { hasOwn, map } from "../util/index.mjs";

import { packPrimitive } from "../lang.mjs";

import { cut } from "./cut.mjs";

import { makeGetExpression } from "./intrinsic.mjs";

import {
  makeApplyExpression,
  makeConstructExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeTryStatement,
} from "./node.mjs";

import { makeTriggerExpression } from "./trigger.mjs";
import {
  makeReadCompletionExpression,
  makeReadFrameExpression,
  makeReadOriginalExpression,
  makeWriteCompletionEffect,
  makeWriteFrameEffect,
  makeWriteOriginalEffect,
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
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: import("../../type/options.d.ts").Advice,
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
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: Pointcut<S>,
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
 *   point: Point<S> & { type: "function.enter" | "program.enter" | "block.enter" },
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => aran.Effect<weave.ResAtom>[]}
 */
export const listEnterTrapEffect = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    const variables = /** @type {weave.ArgVariable[]} */ (
      listKey(point.record)
    );
    const frame = makeTriggerExpression(point, path, advice);
    if (variables.length === 0) {
      return [makeExpressionEffect(frame)];
    } else if (variables.length === 1) {
      return [
        makeWriteOriginalEffect(
          variables[0],
          makeGetExpression(frame, makePrimitiveExpression(variables[0])),
        ),
      ];
    } else {
      return [
        makeWriteFrameEffect(frame),
        ...map(variables, (variable) =>
          makeWriteOriginalEffect(
            variable,
            makeGetExpression(
              makeReadFrameExpression(),
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
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: Pointcut<S>,
 *     advice: {
 *       variable: estree.Variable,
 *       kind: "object" | "function",
 *     },
 *   },
 * ) => {
 *   statements: aran.Statement<weave.ResAtom>[],
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
      statements: [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            [
              ...input.statements,
              makeEffectStatement(makeWriteCompletionEffect(input.completion)),
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
                        : makeReadOriginalExpression("catch.error"),
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
      completion: makeReadCompletionExpression(),
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
 *   path: weave.TargetPath,
 *   options: {
 *     pointcut: Pointcut<S>,
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
                      : makeReadOriginalExpression("catch.error"),
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
