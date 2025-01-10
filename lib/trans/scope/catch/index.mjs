import { makeReadExpression } from "../../node.mjs";
import { zeroSequence } from "../../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../../error.mjs";

export const INITIAL_CATCH = "orphan";

/**
 * @type {import("../api").Extend<
 *    {},
 *    never,
 *    import(".").CatchScope,
 * >}
 */
export const extendCatch = (_hash, _meta, _options, scope) =>
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
export const makeReadErrorExpression = (hash, _meta, scope, _operation) => {
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
