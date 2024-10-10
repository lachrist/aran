import { hasOwn } from "../../../../util/index.mjs";
import { initSyntaxErrorExpression } from "../../../prelude/index.mjs";

/**
 * @type {(
 *   record: {[k in import("estree-sentry").VariableName]?: string},
 * ) => import(".").IllegalFrame}
 */
export const makeIllegalFrame = (record) => ({
  type: "illegal",
  record,
});

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   frame: import(".").IllegalFrame,
 *   operation: (
 *     | import("../../perform").LateDeclareOperation
 *     | import("../../perform").InitializeOperation
 *     | import("../../perform").WriteOperation
 *     | import("../../perform").WriteSloppyFunctionOperation
 *     | import("../../perform").ReadOperation
 *     | import("../../perform").TypeofOperation
 *     | import("../../perform").DiscardOperation
 *   ),
 * ) => null | import("../../../../sequence").Sequence<
 *   import("../../../prelude").SyntaxErrorPrelude,
 *   import("../../../atom").Expression,
 * >}
 */
export const makeIllegalExpression = (hash, _meta, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return initSyntaxErrorExpression(
      `Variable '${operation.variable}' is illegal in ${
        frame.record[operation.variable]
      }`,
      hash,
    );
  } else {
    return null;
  }
};
