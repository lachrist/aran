import { weaveProgram } from "./visit.mjs";

const ROOT = /** @type {import("./atom").TargetPath} */ ("$");

/**
 * @type {<B, L extends Json>(
 *   program: {
 *     root: import("./atom").ArgProgram,
 *     base: B,
 *   },
 *   options: {
 *     evals: {
 *       [k in import("./atom").OriginPath] ?: import("../context").Context
 *     },
 *   },
 *   config: {
 *     advice_variable: estree.Variable,
 *     locate: import("../config").Locate<B, L>,
 *     pointcut: import("./pointcut").Pointcut<L>,
 *   },
 * ) => {
 *   root: import("./atom").ResProgram,
 * }}
 */
export const weave = (
  { base, root },
  { evals },
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
      base,
      locate,
      pointcut,
    },
  ),
});
