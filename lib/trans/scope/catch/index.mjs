import { makeReadExpression } from "../../node.mjs";
import { zeroSequence } from "../../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../../error.mjs";

export const INITIAL_CATCH = "orphan";

/**
 * @type {import("../api.d.ts").Extend<
 *    {},
 *    never,
 *    import("./index.d.ts").CatchScope,
 * >}
 */
export const extendCatch = (_hash, _meta, _options, scope) =>
  zeroSequence({
    ...scope,
    catch: "parent",
  });

/**
 * @type {import("../api.d.ts").PerformExpression<
 *   import("./index.d.ts").CatchScope,
 *   import("./index.d.ts").ReadErrorOperation,
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
