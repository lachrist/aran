export const FRAME_VARIABLE = /** @type {import("./atom.d.ts").ResVariable} */ (
  "frame"
);

export const COMPLETION_VARIABLE =
  /** @type {import("./atom.d.ts").ResVariable} */ ("completion");

export const ADVICE_VARIABLE =
  /** @type {import("./atom.d.ts").ResVariable} */ ("_");

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./atom.d.ts").ResVariable}
 */
export const mangleAdviceVariable = (variable) =>
  /** @type {import("./atom.d.ts").ResVariable} */ (`_.${variable}`);

/**
 * @type {(
 *   variable: import("./atom.d.ts").ArgVariable,
 * ) => import("./atom.d.ts").ResVariable}
 */
export const mangleOriginalVariable = (variable) =>
  /** @type {import("./atom.d.ts").ResVariable} */ (`$.${variable}`);

/**
 * @type {(
 *   depth: import("./depth.d.ts").Depth,
 * ) => import("./atom.d.ts").ResVariable}
 */
export const mangleStateVariable = (depth) =>
  /** @type {import("./atom.d.ts").ResVariable} */ (`state.${depth}`);
