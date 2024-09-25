import { unbuildExpression } from "./expression.mjs";
import { liftSequenceX, zeroSequence } from "../../sequence.mjs";
import {
  makeDynamicPublicKey,
  makePrivateKey,
  makeStaticPublicKey,
} from "../key.mjs";
import { AranTypeError } from "../../report.mjs";

const {
  String,
  Object: { hasOwn },
} = globalThis;

/**
 * @type {(
 *   node: import("../../estree").PublicKeyLiteral,
 * ) => import("../../estree").PublicKey}
 */
const getLiteralKey = (node) => {
  if (hasOwn(node, "bigint") && typeof node.bigint === "string") {
    return /** @type {import("../../estree").PublicKey} */ (node.bigint);
  } else if (typeof node.value === "string") {
    return node.value;
  } else {
    return /** @type {import("../../estree").PublicKey} */ (String(node.value));
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Expression
 *     | import("../../estree").ProtoIdentifier
 *     | import("../../estree").ConstructorIdentifier
 *     | import("../../estree").PublicKeyIdentifier
 *     | import("../../estree").PublicKeyLiteral
 *     | import("../../estree").PrivateKeyIdentifier
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     computed: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../key").Key
 * >}
 */
export const unbuildKey = (
  node,
  meta,
  { digest, scope, annotation, computed },
) => {
  if (computed) {
    const cast = /** @type {import("../../estree").Expression} */ (node);
    return liftSequenceX(
      makeDynamicPublicKey,
      unbuildExpression(cast, meta, { digest, scope, annotation }),
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
        return zeroSequence(makeStaticPublicKey(getLiteralKey(cast)));
      }
      default: {
        throw new AranTypeError(cast);
      }
    }
  }
};
