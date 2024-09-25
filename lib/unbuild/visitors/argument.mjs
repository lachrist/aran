import { everyNarrow, map } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import {
  flatSequence,
  liftSequenceX,
  liftSequence__X_,
} from "../../sequence.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   node: import("../../estree").Expression | import("../../estree").SpreadElement,
 * ) => node is import("../../estree").Expression}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   values: import("../atom").Expression[],
 * ) => import("../argument").ArgumentList}
 */
const makeSpreadArgument = (values) => ({
  type: "spread",
  values,
});

/**
 * @type {(
 *   values: import("../atom").Expression,
 * ) => import("../argument").ArgumentList}
 */
const makeConcatArgument = (value) => ({
  type: "concat",
  value,
});

/**
 * @type {(
 *   nodes: (
 *     | import("../../estree").Expression
 *     | import("../../estree").SpreadElement
 *   )[],
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     hash: import("../../hash").Hash,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../argument").ArgumentList
 * >}
 */
export const unbuildArgumentList = (
  nodes,
  meta,
  { digest, scope, annotation, hash },
) => {
  if (everyNarrow(nodes, isNotSpreadElement)) {
    return liftSequenceX(
      makeSpreadArgument,
      flatSequence(
        map(nodes, (node) =>
          unbuildExpression(node, forkMeta((meta = nextMeta(meta))), {
            digest,
            scope,
            annotation,
          }),
        ),
      ),
    );
  } else {
    return liftSequenceX(
      makeConcatArgument,
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Array.prototype.concat", hash),
        makeArrayExpression([], hash),
        flatSequence(
          map(nodes, (node) =>
            unbuildSpreadable(node, forkMeta((meta = nextMeta(meta))), {
              digest,
              scope,
              annotation,
            }),
          ),
        ),
        hash,
      ),
    );
  }
};
