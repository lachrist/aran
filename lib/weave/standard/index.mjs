import { ROOT_DEPTH } from "../depth.mjs";
import { normalizePointcut } from "./pointcut.mjs";
import { weaveProgram } from "./visit.mjs";

/**
 * @type {(
 *   program: {
 *     root: import("../atom").ArgProgram,
 *     evals: {
 *       [k in import("../../path").Path]
 *         ?: import("../../program").DeepLocalContext
 *     },
 *   },
 *   config: {
 *     advice_variable: import("../../estree").Variable,
 *     pointcut: import("./pointcut").Pointcut,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = ({ root, evals }, { advice_variable, pointcut }) => ({
  root: weaveProgram(root, advice_variable, {
    evals,
    depth: ROOT_DEPTH,
    pointcut: normalizePointcut(pointcut),
  }),
});
