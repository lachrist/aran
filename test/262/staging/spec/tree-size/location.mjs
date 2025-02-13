/**
 * @type {import("aran").Digest<{
 *   NodeHash: import("./location").NodeHash,
 * }>}
 */
export const digest = (_node, node_path, file_path, _kind) =>
  /** @type {import("./location").NodeHash} */ (`${file_path}:${node_path}`);

/**
 * @type {(
 *   hash: (
 *     | import("./location").NodeHash
 *     | "script" | "eval" | "function"
 *   ),
 * ) => import("./location").FilePath}
 */
export const toEvalPath = (hash) =>
  /** @type {import("./location").FilePath} */ (`dynamic://${hash}`);
