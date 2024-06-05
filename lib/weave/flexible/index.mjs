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
 *   program: {
 *     root: import("../atom").ArgProgram,
 *     reboot: import("../../reboot").RebootRecord,
 *   },
 *   config: {
 *     pointcut: import("./aspect").Pointcut,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = ({ root, reboot }, { pointcut }) => ({
  root: weaveProgram(
    { origin: root, parent: null },
    {
      reboot,
      depth: ROOT_DEPTH,
      pointcut: optimizePointcut(pointcut),
      root,
    },
  ),
});
