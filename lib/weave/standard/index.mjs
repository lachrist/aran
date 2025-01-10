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
 *   root: import("../atom").ArgProgram,
 *   config: import("./config").InternalConfig,
 * ) => import("../atom").ResProgram}
 */
export const weave = (root, { initial_state, advice_variable, pointcut }) =>
  weaveProgram(
    root,
    { initial: initial_state, advice: advice_variable },
    {
      depth: ROOT_DEPTH,
      pointcut: normalizePointcut(pointcut),
    },
  );
