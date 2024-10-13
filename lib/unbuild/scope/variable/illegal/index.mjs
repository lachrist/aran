import { liftSequenceX_, zeroSequence } from "../../../../sequence.mjs";
import { hasOwn } from "../../../../util/index.mjs";
import { makeExpressionEffect } from "../../../node.mjs";
import { initSyntaxErrorExpression } from "../../../prelude/index.mjs";

/**
 * @type {import("../../api").Setup<
 *   import(".").RawIllegalFrame,
 *   never,
 *   import(".").IllegalFrame,
 * >}
 */
export const setupIllegalFrame = (_hash, _meta, { record }) =>
  zeroSequence({
    type: "illegal",
    record,
  });

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
 * @type {import("../../api").PerformMaybeExpression<
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
 * @type {import("../../api").PerformMaybeEffect<
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
    return liftSequenceX_(
      makeExpressionEffect,
      initSyntaxErrorExpression(
        `Variable '${variable}' is illegal in ${record[variable]}`,
        hash,
      ),
      hash,
    );
  } else {
    return null;
  }
};
