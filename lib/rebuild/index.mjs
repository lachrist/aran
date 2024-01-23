import { rebuildProgram } from "./program.mjs";

/**
 * @type {(
 *   program: {
 *     root: aran.Program<rebuild.Atom>,
 *   },
 *   config: import("./config").Config,
 * ) => {
 *   root: estree.Program,
 * }}
 */
export const rebuild = ({ root: node }, config) => ({
  root: rebuildProgram(node, config),
});
