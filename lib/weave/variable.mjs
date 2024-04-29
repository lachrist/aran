export const FRAME_VARIABLE = /** @type {weave.ResVariable} */ ("frame");

export const COMPLETION_VARIABLE = /** @type {weave.ResVariable} */ (
  "completion"
);

export const ADVICE_VARIABLE = /** @type {weave.ResVariable} */ ("advice");

const ORIGINAL_PREFIX = "original";

/**
 * @type {(
 *   variable: weave.ArgVariable,
 * ) => weave.ResVariable}
 */
export const mangleOriginalVariable = (variable) =>
  /** @type {weave.ResVariable} */ (`${ORIGINAL_PREFIX}.${variable}`);

const CALLEE_PREFIX = "callee";

/**
 * @type {(
 *   path: weave.TargetPath,
 * ) => weave.ResVariable}
 */
export const mangleCalleeVariable = (path) =>
  /** @type {weave.ResVariable} */ (`${CALLEE_PREFIX}.${path}`);

const LOCATION_PREFIX = "location";

/**
 * @type {(
 *   path: weave.TargetPath,
 * ) => weave.ResVariable}
 */
export const mangleLocationVariable = (path) =>
  /** @type {weave.ResVariable} */ (`${LOCATION_PREFIX}.${path}`);
