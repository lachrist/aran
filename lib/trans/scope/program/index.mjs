import { AranTypeError } from "../../../error.mjs";
import { zeroSequence } from "../../../util/index.mjs";
import { makeReadExpression } from "../../node.mjs";
import { initSyntaxErrorExpression } from "../../prelude/index.mjs";

export const INITIAL_PROGRAM = "root";

/**
 * @type {<S extends import("./index.d.ts").ProgramScope>(
 *   scope: S,
 * ) => S}
 */
export const extendDeepEvalProgram = (scope) => ({
  ...scope,
  program: "deep",
});

/**
 * @type {(
 *   scope: import("./index.d.ts").ProgramScope,
 * ) => import("../../sort.d.ts").Sort}
 */
export const getProgramSort = ({ root, program }) => {
  switch (program) {
    case "deep": {
      return "eval.local.deep";
    }
    case "root": {
      return root;
    }
    default: {
      throw new AranTypeError(program);
    }
  }
};

/**
 * @type {import("../api.d.ts").PerformExpression<
 *   import("./index.d.ts").ProgramScope,
 *   import("./index.d.ts").ReadImportMetaOperation,
 *   import("../../prelude/index.d.ts").SyntaxErrorPrelude,
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
 * @type {import("../api.d.ts").PerformExpression<
 *   import("./index.d.ts").ProgramScope,
 *   import("./index.d.ts").ReadImportOperation,
 *   never,
 * >}
 */
export const makeReadImportExpression = (hash, _meta, _scope, _operation) =>
  zeroSequence(makeReadExpression("import", hash));
