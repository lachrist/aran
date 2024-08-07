import { map } from "../util/index.mjs";
import {
  makeApplyExpression,
  makeClosureExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeRoutineBlock,
  makeTryStatement,
  makeWriteEffect,
} from "./node.mjs";

/**
 * @type {(
 *   prelude: import("./atom").ResEffect[],
 *   throwing: import("./atom").ResExpression,
 *   teardown: import("./atom").ResEffect[],
 * ) => import("./atom").ResEffect[]}
 */
export const weaveRoutineHead = (head, throwing, teardown) =>
  throwing.type === "ReadExpression" && throwing.variable === "catch.error"
    ? head
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeClosureExpression(
              "arrow",
              false,
              makeRoutineBlock(
                [],
                null,
                [
                  makeEffectStatement(
                    makeWriteEffect(
                      "function.callee",
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.get"),
                        makeIntrinsicExpression("undefined"),
                        [
                          makeReadExpression("function.arguments"),
                          makePrimitiveExpression(0),
                        ],
                      ),
                    ),
                  ),
                  makeEffectStatement(
                    makeWriteEffect(
                      "function.arguments",
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.get"),
                        makeIntrinsicExpression("undefined"),
                        [
                          makeReadExpression("function.arguments"),
                          makePrimitiveExpression(1),
                        ],
                      ),
                    ),
                  ),
                  makeTryStatement(
                    makeControlBlock([], [], map(head, makeEffectStatement)),
                    makeControlBlock(
                      [],
                      [],
                      [
                        makeEffectStatement(
                          makeWriteEffect("catch.error", throwing),
                        ),
                        ...map(teardown, makeEffectStatement),
                        makeEffectStatement(
                          makeExpressionEffect(
                            makeApplyExpression(
                              makeIntrinsicExpression("aran.throw"),
                              makeIntrinsicExpression("undefined"),
                              [makeReadExpression("catch.error")],
                            ),
                          ),
                        ),
                      ],
                    ),
                    makeControlBlock([], [], []),
                  ),
                ],
                makeIntrinsicExpression("undefined"),
              ),
            ),
            makeIntrinsicExpression("undefined"),
            [
              makeReadExpression("function.callee"),
              makeReadExpression("function.arguments"),
            ],
          ),
        ),
      ];
