import { optimizePointcut } from "./pointcut.mjs";
import { weaveProgram } from "./visit.mjs";

export {
  aspect_kind_enumeration,
  extractAdvice,
  extractPointcut,
} from "./aspect.mjs";

/**
 * @type {(
 *   program: {
 *     depth: import("../depth").Depth,
 *     root: import("../atom").ArgProgram,
 *     reboot: import("../../reboot").RebootRecord,
 *   },
 *   config: {
 *     initial: import("../../json").Json,
 *     pointcut: import("./aspect").Pointcut,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = ({ root, depth, reboot }, { initial, pointcut }) => ({
  root: weaveProgram(
    { origin: root, parent: null },
    { initial },
    {
      reboot,
      depth,
      pointcut: optimizePointcut(pointcut),
      root,
    },
  ),
});
