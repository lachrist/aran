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
 *   prelude: import("../util/tree.d.ts").Tree<import("./atom.d.ts").ResEffect>,
 *   throwing: import("./atom.d.ts").ResExpression,
 *   teardown: import("../util/tree.d.ts").Tree<import("./atom.d.ts").ResEffect>,
 *   tag: import("./atom.d.ts").Tag,
 * ) => import("../util/tree.d.ts").Tree<import("./atom.d.ts").ResEffect>}
 */
export const weaveRoutineHead = (head, throwing, teardown, tag) =>
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
                      makeIntrinsicExpression("aran.getValueProperty", tag),
                      makeIntrinsicExpression("undefined", tag),
                      [
                        makeReadExpression("function.arguments", tag),
                        makePrimitiveExpression(0, tag),
                      ],
                      tag,
                    ),
                    tag,
                  ),
                  tag,
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    "function.arguments",
                    makeApplyExpression(
                      makeIntrinsicExpression("aran.getValueProperty", tag),
                      makeIntrinsicExpression("undefined", tag),
                      [
                        makeReadExpression("function.arguments", tag),
                        makePrimitiveExpression(1, tag),
                      ],
                      tag,
                    ),
                    tag,
                  ),
                  tag,
                ),
                makeTryStatement(
                  makeSegmentBlock(
                    [],
                    [],
                    mapTree(head, (node) => makeEffectStatement(node, tag)),
                    tag,
                  ),
                  makeSegmentBlock(
                    [],
                    [],
                    concat_X_(
                      makeEffectStatement(
                        makeWriteEffect("catch.error", throwing, tag),
                        tag,
                      ),
                      mapTree(teardown, (node) =>
                        makeEffectStatement(node, tag),
                      ),
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throwException", tag),
                            makeIntrinsicExpression("undefined", tag),
                            [makeReadExpression("catch.error", tag)],
                            tag,
                          ),
                          tag,
                        ),
                        tag,
                      ),
                    ),
                    tag,
                  ),
                  makeSegmentBlock([], [], [], tag),
                  tag,
                ),
              ],
              makeIntrinsicExpression("undefined", tag),
              tag,
            ),
            tag,
          ),
          makeIntrinsicExpression("undefined", tag),
          [
            makeReadExpression("function.callee", tag),
            makeReadExpression("function.arguments", tag),
          ],
          tag,
        ),
        tag,
      );
