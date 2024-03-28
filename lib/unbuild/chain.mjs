import { AranTypeError } from "../error.mjs";
import { filterNarrow, reduce } from "../util/index.mjs";
import { makeConditionalExpression, makeSequenceExpression } from "./node.mjs";
import { isBodyPrelude, isChainPrelude } from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "./sequence.mjs";

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   prelude: (
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").ConditionPrelude
 *   ),
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
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
 *   chain: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").PrefixPrelude
 *       | import("./prelude").ConditionPrelude
 *     ),
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const resolveChain = (sequence, path) =>
  mapSequence(filterSequence(sequence, isBodyPrelude), (node) =>
    reduce(
      filterNarrow(listenSequence(sequence), isChainPrelude),
      (node, prelude) => reduceChain(node, prelude, path),
      node,
    ),
  );
