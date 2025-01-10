import { transExpression } from "./expression.mjs";
import { liftSequenceX, zeroSequence } from "../../util/index.mjs";
import {
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";
import { AranTypeError } from "../../error.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   node: import("estree-sentry").PublicKeyLiteral<import("../hash").HashProp>,
 * ) => (
 *   | import("estree-sentry").PublicKeyName
 *   | import("estree-sentry").PublicKeyValue
 * )}
 */
const getLiteralKey = (node) => {
  if (node.bigint != null) {
    return node.bigint;
  } else if (typeof node.value === "string") {
    return node.value;
  } else if (typeof node.value === "number") {
    return /** @type {import("estree-sentry").PublicKeyValue} */ (
      String(node.value)
    );
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Expression<import("../hash").HashProp>
 *     | import("estree-sentry").ConstructorIdentifier<import("../hash").HashProp>
 *     | import("estree-sentry").PublicKeyIdentifier<import("../hash").HashProp>
 *     | import("estree-sentry").PublicKeyLiteral<import("../hash").HashProp>
 *     | import("estree-sentry").PrivateKeyIdentifier<import("../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   computed: boolean,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../key").Key
 * >}
 */
export const transKey = (node, meta, scope, computed) => {
  if (computed) {
    const cast =
      /** @type {import("estree-sentry").Expression<import("../hash").HashProp>} */ (
        node
      );
    return liftSequenceX(
      makeDynamicPublicKey,
      transExpression(cast, meta, scope),
    );
  } else {
    const cast = /**
     * @type {(
     *   | import("estree-sentry").PublicKeyIdentifier<import("../hash").HashProp>
     *   | import("estree-sentry").PublicKeyLiteral<import("../hash").HashProp>
     *   | import("estree-sentry").PrivateKeyIdentifier<import("../hash").HashProp>
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
        return zeroSequence(makeStaticPublicKey(getLiteralKey(cast)));
      }
      default: {
        throw new AranTypeError(cast);
      }
    }
  }
};
