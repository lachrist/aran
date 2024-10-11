import { makeReadExpression } from "../../node.mjs";
import { zeroSequence } from "../../../sequence.mjs";
import { AranExecError, AranTypeError } from "../../../report.mjs";

export const INITIAL_CATCH = "orphan";

/**
 * @type {import("../api").Extend<
 *    null,
 *    never,
 *    import(".").CatchScope,
 * >}
 */
export const extendCatch = (_hash, _meta, scope, _options) =>
  zeroSequence({
    ...scope,
    catch: "parent",
  });

/**
 * @type {import("../api").PerformExpression<
 *   import(".").CatchScope,
 *   import(".").ReadErrorOperation,
 *   never,
 * >}
 */
export const makeCatchReadErrorExpression = (
  hash,
  _meta,
  scope,
  _operation,
) => {
  switch (scope.catch) {
    case "parent": {
      return zeroSequence(makeReadExpression("catch.error", hash));
    }
    case "orphan": {
      throw new AranExecError("Illegal 'catch.error' read");
    }
    default: {
      throw new AranTypeError(scope.catch);
    }
  }
};
