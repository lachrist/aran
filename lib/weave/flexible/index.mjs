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
 *   config: import("./config").InternalConfig,
 * ) => import("../atom").ResProgram}
 */
export const weave = (root, { initial_state, pointcut }) =>
  weaveProgram(
    { origin: root, parent: null },
    { initial: initial_state },
    {
      depth: ROOT_DEPTH,
      pointcut: optimizePointcut(pointcut),
      root,
    },
  );
