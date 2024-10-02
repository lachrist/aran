export const FRAME_VARIABLE = /** @type {import("./atom").ResVariable} */ (
  "frame"
);

export const COMPLETION_VARIABLE = /** @type {import("./atom").ResVariable} */ (
  "completion"
);

export const ADVICE_VARIABLE = /** @type {import("./atom").ResVariable} */ (
  "_"
);

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./atom").ResVariable}
 */
export const mangleAdviceVariable = (variable) =>
  /** @type {import("./atom").ResVariable} */ (`_.${variable}`);

/**
 * @type {(
 *   variable: import("./atom").ArgVariable,
 * ) => import("./atom").ResVariable}
 */
export const mangleOriginalVariable = (variable) =>
  /** @type {import("./atom").ResVariable} */ (`$.${variable}`);

/**
 * @type {(
 *   depth: import("./depth").Depth,
 * ) => import("./atom").ResVariable}
 */
export const mangleStateVariable = (depth) =>
  /** @type {import("./atom").ResVariable} */ (`state.${depth}`);
