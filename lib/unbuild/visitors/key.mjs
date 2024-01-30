import { unbuildExpression } from "./expression.mjs";
import { reportEarlyError } from "../early-error.mjs";
import { initSequence, zeroSequence } from "../sequence.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";
import {
  ILLEGAL_NON_COMPUTED_KEY,
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Expression
 *     | estree.PrivateIdentifier
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     computed: boolean,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   import("../key").Key
 * >}
 */
export const unbuildKey = ({ node, path, meta }, scope, { computed }) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      return initSequence(
        [
          makeEarlyErrorPrelude({
            guard: null,
            message: "Invalid computed key: PrivateIdentifier",
            path,
          }),
        ],
        makePrivateKey(/** @type {estree.PrivateKey} */ (node.name)),
      );
    } else {
      return zeroSequence(
        makeDynamicPublicKey(
          unbuildExpression({ node, path, meta }, scope, null),
        ),
      );
    }
  } else {
    switch (node.type) {
      case "Identifier": {
        return zeroSequence(
          makeStaticPublicKey(/** @type {estree.Key} */ (node.name)),
        );
      }
      case "PrivateIdentifier": {
        return zeroSequence(
          makePrivateKey(/** @type {estree.PrivateKey} */ (node.name)),
        );
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return reportEarlyError(
            ILLEGAL_NON_COMPUTED_KEY,
            "Illegal non-computed key: RegExpLiteral",
            path,
          );
        } else if (isBigIntLiteral(node)) {
          return zeroSequence(
            makeStaticPublicKey(/** @type {estree.Key} */ (node.bigint)),
          );
        } else {
          return zeroSequence(
            makeStaticPublicKey(/** @type {estree.Key} */ (String(node.value))),
          );
        }
      }
      default: {
        return reportEarlyError(
          ILLEGAL_NON_COMPUTED_KEY,
          `Illegal non-computed key: ${node.type}`,
          path,
        );
      }
    }
  }
};
