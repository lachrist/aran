import {
  hasOwn,
  liftSequenceX_,
  zeroSequence,
} from "../../../../util/index.mjs";
import { makeExpressionEffect } from "../../../node.mjs";
import { initSyntaxErrorExpression } from "../../../prelude/index.mjs";

/**
 * @type {import("../../api.d.ts").Setup<
 *   import("./index.d.ts").RawIllegalFrame,
 *   never,
 *   import("./index.d.ts").IllegalFrame,
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
 * ) => import("./index.d.ts").IllegalFrame}
 */
export const makeIllegalFrame = (record) => ({
  type: "illegal",
  record,
});

/**
 * @type {import("../../api.d.ts").PerformMaybeExpression<
 *   import("./index.d.ts").IllegalFrame,
 *   { variable: import("estree-sentry").VariableName },
 *   import("../../../prelude/index.d.ts").SyntaxErrorPrelude,
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
 * @type {import("../../api.d.ts").PerformMaybeEffect<
 *   import("./index.d.ts").IllegalFrame,
 *   { variable: import("estree-sentry").VariableName },
 *   import("../../../prelude/index.d.ts").SyntaxErrorPrelude,
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
