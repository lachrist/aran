import { weave as weaveStandard } from "./standard/index.mjs";
import { weave as weaveFlexible } from "./flexible/index.mjs";
import { AranInputError } from "../error.mjs";
import { ROOT_DEPTH } from "./depth.mjs";

export { aspect_kind_enumeration as standard_aspect_kind_enumeration } from "./standard/index.mjs";
export { aspect_kind_enumeration as flexible_aspect_kind_enumeration } from "./flexible/index.mjs";
export {
  extractPointcut as extractStandardPointcut,
  extractAdvice as extractStandardAdvice,
} from "./standard/index.mjs";
export {
  extractPointcut as extractFlexiblePointcut,
  extractAdvice as extractFlexibleAdvice,
} from "./flexible/index.mjs";
export {
  isProgramKind,
  isClosureKind,
  isControlKind,
} from "./parametrization.mjs";

/**
 * @type {(
 *   program: {
 *     root: import("./atom").ArgProgram,
 *     depth: import("./depth").Depth | null,
 *     reboot: import("../reboot").RebootRecord,
 *   },
 *   config: import("./config").Config,
 * ) => {
 *   root: import("./atom").ResProgram,
 * }}
 */
export const weave = (
  { root, depth, reboot },
  { flexible_pointcut, standard_pointcut, initial_state, advice_variable },
) => {
  const program = {
    root,
    depth: depth === null ? ROOT_DEPTH : depth,
    reboot,
  };
  if (flexible_pointcut !== null && standard_pointcut !== null) {
    throw new AranInputError(
      "Either config.flexible_pointcut or config.flexible_pointcut should be provided but not both",
    );
  } else if (flexible_pointcut !== null) {
    return weaveFlexible(program, {
      pointcut: flexible_pointcut,
      initial: initial_state,
    });
  } else if (standard_pointcut !== null) {
    return weaveStandard(program, {
      pointcut: standard_pointcut,
      initial: initial_state,
      advice: advice_variable,
    });
  } else {
    throw new AranInputError(
      "Either config.flexible_pointcut or config.flexible_pointcut should be provided",
    );
  }
};
