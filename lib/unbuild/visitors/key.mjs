import { unbuildExpression } from "./expression.mjs";
import { makeRegularEarlyError } from "../early-error.mjs";
import { initSequence, liftSequenceX, zeroSequence } from "../sequence.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";
import {
  ILLEGAL_NON_COMPUTED_KEY,
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";

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
 *   import("../prelude").BodyPrelude,
 *   import("../key").Key
 * >}
 */
export const unbuildKey = ({ node, path, meta }, scope, { computed }) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      return initSequence(
        [
          makeEarlyErrorPrelude(
            makeRegularEarlyError(
              "Invalid computed key: PrivateIdentifier",
              path,
            ),
          ),
        ],
        makePrivateKey(/** @type {estree.PrivateKey} */ (node.name)),
      );
    } else {
      return liftSequenceX(
        makeDynamicPublicKey,
        unbuildExpression({ node, path, meta }, scope, null),
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
          return initSequence(
            [
              makeEarlyErrorPrelude(
                makeRegularEarlyError(
                  "Illegal non-computed key: RegExpLiteral",
                  path,
                ),
              ),
            ],
            ILLEGAL_NON_COMPUTED_KEY,
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
        return initSequence(
          [
            makeEarlyErrorPrelude(
              makeRegularEarlyError(
                "Illegal non-computed key: " + node.type,
                path,
              ),
            ),
          ],
          ILLEGAL_NON_COMPUTED_KEY,
        );
      }
    }
  }
};
