import { rebuildProgram } from "./program.mjs";

/**
 * @type {(
 *   program: {
 *     root: import("./atom").Program,
 *   },
 *   config: import("./config").Config,
 * ) => {
 *   root: estree.Program,
 * }}
 */
export const rebuild = ({ root }, config) => ({
  root: rebuildProgram(root, config),
});
