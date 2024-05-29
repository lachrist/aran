import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {import("./atom").TargetPath} */ ("$");

/**
 * @type {<L extends Json>(
 *   program: {
 *     root: import("./atom").ArgProgram,
 *     evals: {
 *       [k in import("./atom").OriginPath]
 *         ?: import("../program").DeepLocalContext
 *     },
 *   },
 *   config: {
 *     advice_variable: estree.Variable,
 *     locate: import("../config").Locate<L>,
 *     pointcut: import("./pointcut").Pointcut<L>,
 *   },
 * ) => {
 *   root: import("./atom").ResProgram,
 * }}
 */
export const weave = (
  { root, evals },
  { advice_variable, locate, pointcut },
) => ({
  root: weaveProgram(
    { node: root, path: ROOT },
    {
      evals,
      advice: {
        kind: typeof pointcut === "function" ? "function" : "object",
        variable: advice_variable,
      },
      locate,
      pointcut,
    },
  ),
});
