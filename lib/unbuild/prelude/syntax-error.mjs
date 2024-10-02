import { initSequence } from "../../sequence.mjs";
import { retrieve } from "../hash.mjs";
import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {(
 *   syntax_error: {
 *     message: string,
 *     origin: import("../../hash").Hash,
 *   },
 *   root: import("estree-sentry").Program<import("../../hash").HashProp>,
 * ) => import("../../report").SyntaxErrorCause}
 */
export const toSyntaxErrorCause = ({ message, origin }, root) => ({
  message,
  node: retrieve(root, origin),
  hash: origin,
});

/**
 * @type {(
 *   message: string,
 *   hash: import("../../hash").Hash,
 * ) => import("../../sequence").Sequence<
 *   import(".").SyntaxErrorPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const initSyntaxErrorExpression = (message, hash) =>
  initSequence(
    [
      {
        type: "syntax-error",
        data: {
          message,
          origin: hash,
        },
      },
    ],
    makePrimitiveExpression(`ARAN_EARLY_ERROR >> ${message} >> ${hash}`, hash),
  );
