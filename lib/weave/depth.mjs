export const ROOT_DEPTH = /** @type {import("./depth").Depth} */ (0);

/**
 * @type {(
 *   depth: import("./depth").Depth,
 * ) => import("./depth").Depth}
 */
export const incrementDepth = (depth) =>
  /** @type {import("./depth").Depth} */ (depth + 1);
