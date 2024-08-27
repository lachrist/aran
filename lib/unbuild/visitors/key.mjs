import { unbuildExpression } from "./expression.mjs";
import { initSequence, liftSequenceX, zeroSequence } from "../../sequence.mjs";
import {
  ILLEGAL_NON_COMPUTED_KEY,
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";
import { makeErrorPrelude } from "../prelude/index.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Expression
 *     | import("../../estree").ProtoIdentifier
 *     | import("../../estree").ConstructorIdentifier
 *     | import("../../estree").PublicKeyIdentifier
 *     | import("../../estree").PublicKeyLiteral
 *     | import("../../estree").PrivateKeyIdentifier
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
    const cast = /** @type {import("../../estree").Expression} */ (node);
    return liftSequenceX(
      makeDynamicPublicKey,
      unbuildExpression({ node: cast, path, meta }, scope, null),
    );
  } else {
    const cast = /**
     * @type {(
     *   | import("../../estree").PublicKeyIdentifier
     *   | import("../../estree").PublicKeyLiteral
     *   | import("../../estree").PrivateKeyIdentifier
     * )}
     */ (node);
    switch (cast.type) {
      case "Identifier": {
        return zeroSequence(makeStaticPublicKey(cast.name));
      }
      case "PrivateIdentifier": {
        return zeroSequence(makePrivateKey(cast.name));
      }
      case "Literal": {
        return zeroSequence(makeStaticPublicKey(cast.value));
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
