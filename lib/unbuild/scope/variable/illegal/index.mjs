import { liftSequenceX, liftSequenceX_ } from "../../../../sequence.mjs";
import { concat_, hasOwn } from "../../../../util/index.mjs";
import { makeExpressionEffect } from "../../../node.mjs";
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
 * @type {import("../../perform").PerformMaybeExpression<
 *   import(".").IllegalFrame,
 *   { variable: import("estree-sentry").VariableName },
 *   import("../../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const makeIllegalLoadExpression = (
  hash,
  _meta,
  { record },
  { variable },
) => {
  if (hasOwn(record, variable)) {
    return initSyntaxErrorExpression(
      `Variable '${variable}' is illegal in ${record[variable]}`,
      hash,
    );
  } else {
    return null;
  }
};

/**
 * @type {import("../../perform").PerformMaybeEffect<
 *   import(".").IllegalFrame,
 *   { variable: import("estree-sentry").VariableName },
 *   import("../../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const listIllegalSaveEffect = (
  hash,
  _meta,
  { record },
  { variable },
) => {
  if (hasOwn(record, variable)) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression(
          `Variable '${variable}' is illegal in ${record[variable]}`,
          hash,
        ),
        hash,
      ),
    );
  } else {
    return null;
  }
};
