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
 *   config: import("./config").Config,
 * ) => {
 *   root: import("../atom").ResProgram,
 * }}
 */
export const weave = (
  { root, depth, reboot },
  { initial, advice_variable: advice, pointcut },
) => ({
  root: weaveProgram(
    root,
    { initial, advice },
    {
      reboot,
      depth,
      pointcut: normalizePointcut(pointcut),
    },
  ),
});
