import { initSequence } from "../../sequence.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { retreive } from "../../hash.mjs";

/**
 * @type {(
 *   syntax_error: {
 *     message: string,
 *     origin: import("../../hash").Hash,
 *   },
 *   options: {
 *     digest: import("../../hash").Digest,
 *     root: import("../../estree").Program,
 *   },
 * ) => import("../../report").SyntaxErrorCause}
 */
export const toSyntaxErrorCause = ({ message, origin }, { digest, root }) => ({
  message,
  node: retreive(root, origin, digest),
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
