import { every, mapIndex } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import {
  flatSequence,
  liftSequenceX,
  liftSequence__X_,
} from "../../sequence.mjs";
import { drillSite } from "../site.mjs";
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
 *   site: import("../site").Site<(
 *     | import("../../estree").Expression
 *     | import("../../estree").SpreadElement
 *   )[]>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../argument").ArgumentList
 * >}
 */
export const unbuildArgumentList = ({ node, path, meta }, scope, _options) => {
  if (every(node, isNotSpreadElement)) {
    return liftSequenceX(
      makeSpreadArgument,
      flatSequence(
        mapIndex(node.length, (index) =>
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
            scope,
            null,
          ),
        ),
      ),
    );
  } else {
    return liftSequenceX(
      makeConcatArgument,
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Array.prototype.concat", path),
        makeArrayExpression([], path),
        flatSequence(
          mapIndex(node.length, (index) =>
            unbuildSpreadable(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
              scope,
              null,
            ),
          ),
        ),
        path,
      ),
    );
  }
};
