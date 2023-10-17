import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {weave.TargetPath} */ ("$");

/**
 * @type {<L extends Json>(
 *   program: aran.Program<weave.ArgAtom>,
 *   options: import("./visit.mjs").Options<L>,
 * ) => {
 *   node: aran.Program<weave.ResAtom>,
 *   logs: [],
 * }}
 */
export const weave = (program, options) => ({
  node: weaveProgram({ node: program, path: ROOT }, options),
  logs: [],
});
