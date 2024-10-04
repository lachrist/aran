import { weave as weaveStandard } from "./standard/index.mjs";
import { weave as weaveFlexible } from "./flexible/index.mjs";
import { AranTypeError } from "../report.mjs";
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
 *   root: import("./atom").ResProgram
 * }}
 */
export const weave = (
  { root, depth, reboot },
  { pointcut, initial_state, advice_variable },
) => {
  const program = {
    root,
    depth: depth === null ? ROOT_DEPTH : depth,
    reboot,
  };
  switch (pointcut.type) {
    case "standard": {
      return {
        root: weaveStandard(program, {
          pointcut: pointcut.data,
          initial: initial_state,
          advice: advice_variable,
        }),
      };
    }
    case "flexible": {
      return {
        root: weaveFlexible(program, {
          pointcut: pointcut.data,
          initial: initial_state,
        }),
      };
    }
    default: {
      throw new AranTypeError(pointcut);
    }
  }
};
