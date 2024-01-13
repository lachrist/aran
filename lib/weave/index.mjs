import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {weave.TargetPath} */ ("$");

/**
 * @type {<B, L extends Json>(
 *   program: {
 *     root: aran.Program<weave.ArgAtom>,
 *     base: B,
 *   },
 *   options: {
 *     evals: Record<
 *       weave.OriginPath,
 *       import("../context").InternalLocalEvalContext
 *     >,
 *   },
 *   config: {
 *     advice: estree.Variable,
 *     locate: import("../config").Locate<B, L>,
 *     pointcut: import("../../type/advice").Pointcut<L>,
 *   },
 * ) => {
 *   root: aran.Program<weave.ResAtom>,
 * }}
 */
export const weave = (
  { base, root },
  { evals },
  { advice, locate, pointcut },
) => ({
  root: weaveProgram(
    { node: root, path: ROOT },
    {
      evals,
      advice: {
        kind: typeof pointcut === "function" ? "function" : "object",
        variable: advice,
      },
      base,
      locate,
      pointcut,
    },
  ),
});
