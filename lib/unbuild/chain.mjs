import { AranTypeError } from "../error.mjs";
import { filterNarrow, reduceReverse } from "../util/index.mjs";
import { makeConditionalExpression, makeSequenceExpression } from "./node.mjs";
import { isBodyPrelude, isChainPrelude } from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "../sequence.mjs";

/**
 * @type {(
 *   node: import("./atom").Expression,
 *   prelude: (
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").ConditionPrelude
 *   ),
 *   path: import("../path").Path,
 * ) => import("./atom").Expression}
 */
const reduceChain = (node, prelude, path) => {
  switch (prelude.type) {
    case "prefix": {
      return makeSequenceExpression([prelude.data], node, path);
    }
    case "condition": {
      return makeConditionalExpression(
        prelude.data.test,
        prelude.data.exit,
        node,
        path,
      );
    }
    default: {
      throw new AranTypeError(prelude);
    }
  }
};

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   chain: import("../sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").PrefixPrelude
 *       | import("./prelude").ConditionPrelude
 *     ),
 *     import("./atom").Expression,
 *   >,
 *   path: import("../path").Path,
 * ) => import("../sequence").Sequence<
 *   P,
 *   import("./atom").Expression,
 * >}
 */
export const resolveChain = (sequence, path) =>
  mapSequence(filterSequence(sequence, isBodyPrelude), (node) =>
    reduceReverse(
      filterNarrow(listenSequence(sequence), isChainPrelude),
      (node, prelude) => reduceChain(node, prelude, path),
      node,
    ),
  );
