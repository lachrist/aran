import { concat_X_, mapTree } from "../util/index.mjs";
import {
  makeApplyExpression,
  makeClosureExpression,
  makeSegmentBlock,
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
 *   prelude: import("../util/tree").Tree<import("./atom").ResEffect>,
 *   throwing: import("./atom").ResExpression,
 *   teardown: import("../util/tree").Tree<import("./atom").ResEffect>,
 * ) => import("../util/tree").Tree<import("./atom").ResEffect>}
 */
export const weaveRoutineHead = (head, throwing, teardown) =>
  throwing.type === "ReadExpression" && throwing.variable === "catch.error"
    ? head
    : makeExpressionEffect(
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
                  makeSegmentBlock([], [], mapTree(head, makeEffectStatement)),
                  makeSegmentBlock(
                    [],
                    [],
                    concat_X_(
                      makeEffectStatement(
                        makeWriteEffect("catch.error", throwing),
                      ),
                      mapTree(teardown, makeEffectStatement),
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throw"),
                            makeIntrinsicExpression("undefined"),
                            [makeReadExpression("catch.error")],
                          ),
                        ),
                      ),
                    ),
                  ),
                  makeSegmentBlock([], [], []),
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
      );
