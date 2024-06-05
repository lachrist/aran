import { ROOT_DEPTH } from "../depth.mjs";
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
 *     reboot: import("../../reboot").RebootRecord,
 *   },
 *   config: {
 *     advice_variable: import("../../estree").Variable,
 *     pointcut: import("./aspect").Pointcut,
 *   },
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = ({ root, reboot }, { advice_variable, pointcut }) => ({
  root: weaveProgram(root, advice_variable, {
    reboot,
    depth: ROOT_DEPTH,
    pointcut: normalizePointcut(pointcut),
  }),
});
