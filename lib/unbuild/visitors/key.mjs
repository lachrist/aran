import { unbuildExpression } from "./expression.mjs";
import { initSequence, liftSequenceX, zeroSequence } from "../../sequence.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";
import {
  ILLEGAL_NON_COMPUTED_KEY,
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";
import { makeErrorPrelude } from "../prelude/index.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Expression
 *     | import("../../estree").PrivateIdentifier
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     computed: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../key").Key
 * >}
 */
export const unbuildKey = ({ node, path, meta }, scope, { computed }) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      return initSequence(
        [
          makeErrorPrelude({
            message: "Invalid computed key: PrivateIdentifier",
            origin: path,
          }),
        ],
        makePrivateKey(
          /** @type {import("../../estree").PrivateKey} */ (node.name),
        ),
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
          makeStaticPublicKey(
            /** @type {import("../../estree").Key} */ (node.name),
          ),
        );
      }
      case "PrivateIdentifier": {
        return zeroSequence(
          makePrivateKey(
            /** @type {import("../../estree").PrivateKey} */ (node.name),
          ),
        );
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return initSequence(
            [
              makeErrorPrelude({
                message: "Illegal non-computed key: RegExpLiteral",
                origin: path,
              }),
            ],
            ILLEGAL_NON_COMPUTED_KEY,
          );
        } else if (isBigIntLiteral(node)) {
          return zeroSequence(
            makeStaticPublicKey(
              /** @type {import("../../estree").Key} */ (node.bigint),
            ),
          );
        } else {
          return zeroSequence(
            makeStaticPublicKey(
              /** @type {import("../../estree").Key} */ (String(node.value)),
            ),
          );
        }
      }
      default: {
        return initSequence(
          [
            makeErrorPrelude({
              message: `Illegal non-computed key: ${node.type}`,
              origin: path,
            }),
          ],
          ILLEGAL_NON_COMPUTED_KEY,
        );
      }
    }
  }
};
