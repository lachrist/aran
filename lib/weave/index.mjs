import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {weave.TargetPath} */ ("$");

/**
 * @type {<L extends Json>(
 *   program: aran.Program<weave.ArgAtom>,
 *   options: {
 *     situ: import("../situ").Situ,
 *     base: import("../../type/options").Base,
 *     advice: estree.Variable,
 *     locate: import("../../type/options").Locate<L>,
 *     pointcut: import("../../type/advice").Pointcut<L>,
 *   },
 * ) => {
 *   node: aran.Program<weave.ResAtom>,
 * }}
 */
export const weave = (program, { situ, advice, base, locate, pointcut }) => ({
  node: weaveProgram(
    { node: program, path: ROOT },
    {
      advice: {
        kind: typeof pointcut === "function" ? "function" : "object",
        variable: advice,
      },
      base,
      locate,
      pointcut,
    },
    situ,
  ),
});
