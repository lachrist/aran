import { AranTypeError } from "../../../report.mjs";
import { zeroSequence } from "../../../util/index.mjs";
import { makeReadExpression } from "../../node.mjs";
import { initSyntaxErrorExpression } from "../../prelude/index.mjs";

export const INITIAL_PROGRAM = "root";

/**
 * @type {import("../api").Extend<
 *   null,
 *   never,
 *   import(".").ProgramScope,
 * >}
 */
export const extendProgram = (_hash, _meta, _options, scope) =>
  zeroSequence({
    ...scope,
    program: "deep",
  });

/**
 * @type {(
 *   scope: import(".").ProgramScope,
 * ) => import("../../sort").Sort}
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
 * @type {import("../api").PerformExpression<
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
 * @type {import("../api").PerformExpression<
 *   import(".").ProgramScope,
 *   import(".").ReadImportOperation,
 *   never,
 * >}
 */
export const makeReadImportExpression = (hash, _meta, _scope, _operation) =>
  zeroSequence(makeReadExpression("import", hash));
