import { initSequence } from "../../sequence.mjs";
import { makePrimitiveExpression } from "../node.mjs";

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
