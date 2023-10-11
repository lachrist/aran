import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {weave.TargetPath} */ ("$");

/**
 * @type {<L extends Json>(
 *   program: aran.Program<weave.ArgAtom>,
 *   options: import("./visit.mjs").Options<L>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const weave = (program, options) =>
  weaveProgram({ node: program, path: ROOT }, options);
