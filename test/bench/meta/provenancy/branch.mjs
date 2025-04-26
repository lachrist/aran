const { parseInt } = globalThis;

/**
 * @type {(
 *   kind: import("aran").TestKind,
 *   prov: number,
 *   hash: import("./location.d.ts").NodeHash,
 * ) => string}
 */
export const printBranch = (kind, prov, hash) => `${kind}|${prov}|${hash}\n`;

/**
 * @type {(
 *   line: string,
 * ) => import("./branch.d.ts").Branch}
 */
export const parseBranch = (line) => {
  const parts = line.split("|");
  return {
    kind: /** @type {any} */ (parts[0]),
    prov: parseInt(parts[1]),
    hash: parts[2],
  };
};
