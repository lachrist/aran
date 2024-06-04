import { ROOT_DEPTH } from "../depth.mjs";
import { optimizePointcut } from "./pointcut.mjs";
import { weaveProgram } from "./visit.mjs";

export { aspect_kind_enumeration } from "./aspect.mjs";

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
 *     pointcut: import("./aspect").Pointcut,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = ({ root, evals }, { pointcut }) => ({
  root: weaveProgram(
    { origin: root, parent: null },
    {
      evals,
      depth: ROOT_DEPTH,
      pointcut: optimizePointcut(pointcut),
      root,
    },
  ),
});
