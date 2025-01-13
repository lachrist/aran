import {
  everyNarrow,
  map,
  flatSequence,
  liftSequenceX,
  liftSequence__X_,
} from "../../util/index.mjs";
import {
  makeConcatArgumentList,
  makeSpreadArgumentList,
} from "../arguments.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { transExpression } from "./expression.mjs";
import { transSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../hash").HashProp> | import("estree-sentry").SpreadElement<import("../hash").HashProp>,
 * ) => node is import("estree-sentry").Expression<import("../hash").HashProp>}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   nodes: (
 *     | import("estree-sentry").Expression<import("../hash").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../hash").HashProp>
 *   )[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   hash: import("../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../argument").ArgumentList
 * >}
 */
export const transArgumentList = (nodes, meta, scope, hash) => {
  if (everyNarrow(nodes, isNotSpreadElement)) {
    return liftSequenceX(
      makeSpreadArgumentList,
      flatSequence(
        map(nodes, (node) =>
          transExpression(node, forkMeta((meta = nextMeta(meta))), scope),
        ),
      ),
    );
  } else {
    return liftSequenceX(
      makeConcatArgumentList,
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Array.prototype.concat", hash),
        makeArrayExpression([], hash),
        flatSequence(
          map(nodes, (node) =>
            transSpreadable(node, forkMeta((meta = nextMeta(meta))), scope),
          ),
        ),
        hash,
      ),
    );
  }
};
