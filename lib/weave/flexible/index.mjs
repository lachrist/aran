import { ROOT_DEPTH } from "../depth.mjs";
import { optimizePointcut } from "./pointcut.mjs";
import { weaveProgram } from "./visit.mjs";

export {
  aspect_kind_enumeration,
  extractAdvice,
  extractPointcut,
} from "./aspect.mjs";

/**
 * @type {(
 *   root: import("../atom").ArgProgram,
 *   config: {
 *     initial: import("../../util/util").Json,
 *     pointcut: import("./aspect").Pointcut<
 *       import("../../hash").Hash
 *     >,
 *   },
 * ) => import("../atom").ResProgram}
 */
export const weave = (root, { initial, pointcut }) =>
  weaveProgram(
    { origin: root, parent: null },
    { initial },
    {
      depth: ROOT_DEPTH,
      pointcut: optimizePointcut(pointcut),
      root,
    },
  );
