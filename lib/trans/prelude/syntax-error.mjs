import { initSequence } from "../../util/index.mjs";
import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {(
 *   message: string,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("./index.d.ts").SyntaxErrorPrelude,
 *   import("../atom.d.ts").Expression,
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
