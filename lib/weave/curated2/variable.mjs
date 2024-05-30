export const FRAME_VARIABLE = /** @type {import("../atom").ResVariable} */ (
  "frame"
);

export const RECORD_VARIABLE = /** @type {import("../atom").ResVariable} */ (
  "record"
);

export const COMPLETION_VARIABLE =
  /** @type {import("../atom").ResVariable} */ ("completion");

export const ADVICE_VARIABLE = /** @type {import("../atom").ResVariable} */ (
  "advice"
);

const ORIGINAL_PREFIX = "original";

/**
 * @type {(
 *   variable: import("../atom").ArgVariable,
 * ) => import("../atom").ResVariable}
 */
export const mangleOriginalVariable = (variable) =>
  /** @type {import("../atom").ResVariable} */ (
    `${ORIGINAL_PREFIX}.${variable}`
  );

const LOCATION_PREFIX = "location";

/**
 * @type {(
 *   trail: import("./trail").Trail,
 * ) => import("../atom").ResVariable}
 */
export const mangleLocationVariable = (trail) =>
  /** @type {import("../atom").ResVariable} */ (`${LOCATION_PREFIX}.${trail}`);
