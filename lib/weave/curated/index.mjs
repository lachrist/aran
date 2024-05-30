import { ROOT_TRAIL } from "./trail.mjs";
import { weaveProgram } from "./visit.mjs";

/**
 * @type {<L extends Json>(
 *   program: {
 *     root: import("../atom").ArgProgram,
 *     evals: {
 *       [k in import("../../path").Path]
 *         ?: import("../../program").DeepLocalContext
 *     },
 *   },
 *   config: {
 *     advice_variable: import("../../estree").Variable,
 *     locate: import("../../config").Locate<L>,
 *     pointcut: import("./pointcut").Pointcut<L>,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = (
  { root, evals },
  { advice_variable, locate, pointcut },
) => ({
  root: weaveProgram(
    { node: root, trail: ROOT_TRAIL },
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
