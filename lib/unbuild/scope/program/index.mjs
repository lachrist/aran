import { zeroSequence } from "../../../sequence.mjs";
import { makeReadExpression } from "../../node.mjs";
import { initSyntaxErrorExpression } from "../../prelude/index.mjs";

/**
 * @type {(
 *   scope: import(".").ProgramScope,
 * ) => import("../../sort").Sort}
 */
const getProgramSort = (scope) => (scope.eval ? "eval.local.deep" : scope.root);

/**
 * @type {import("../perform").PerformExpression<
 *   import(".").ProgramScope,
 *   import(".").ReadImportMetaOperation,
 *   import("../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const makeReadImportMetaExpression = (
  hash,
  _meta,
  scope,
  _operation,
) => {
  const sort = getProgramSort(scope);
  if (sort === "module") {
    return zeroSequence(makeReadExpression("import.meta", hash));
  } else {
    return initSyntaxErrorExpression(
      `Illegal 'import.meta' read in ${sort} program`,
      hash,
    );
  }
};

/**
 * @type {import("../perform").PerformExpression<
 *   import(".").ProgramScope,
 *   import(".").ReadImportOperation,
 *   never,
 * >}
 */
export const makeReadImportExpression = (hash, _meta, _scope, _operation) =>
  zeroSequence(makeReadExpression("import", hash));
