export const ROOT_DEPTH = /** @type {import("./depth.d.ts").Depth} */ (0);

/**
 * @type {(
 *   depth: import("./depth.d.ts").Depth,
 * ) => import("./depth.d.ts").Depth}
 */
export const incrementDepth = (depth) =>
  /** @type {import("./depth.d.ts").Depth} */ (depth + 1);
