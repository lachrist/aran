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
 *   config: {
 *     initial: import("../../util/util").Json,
 *     advice: import("estree-sentry").VariableName,
 *     pointcut: import("./aspect").Pointcut<
 *       import("../../hash").Hash
 *     >,
 *   },
 * ) => import("../atom").ResProgram}
 */
export const weave = (root, { initial, advice, pointcut }) =>
  weaveProgram(
    root,
    { initial, advice },
    {
      depth: ROOT_DEPTH,
      pointcut: normalizePointcut(pointcut),
    },
  );
