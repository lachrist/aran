import { normalizePointcut } from "./pointcut.mjs";
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
 *     depth: import("../depth").Depth,
 *     reboot: import("../../reboot").RebootRecord,
 *   },
 *   config: {
 *     initial: import("../../json").Json,
 *     advice: import("../../estree").Variable,
 *     pointcut: import("./aspect").Pointcut,
 *   },
 * ) => import("../atom").ResProgram}
 */
export const weave = ({ root, depth, reboot }, { initial, advice, pointcut }) =>
  weaveProgram(
    root,
    { initial, advice },
    {
      reboot,
      depth,
      pointcut: normalizePointcut(pointcut),
    },
  );
