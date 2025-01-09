import { weave as weaveStandard } from "./standard/index.mjs";
import { weave as weaveFlexible } from "./flexible/index.mjs";
import { AranTypeError } from "../error.mjs";

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
  isSegmentKind,
  listParameter,
} from "./parametrization.mjs";

/**
 * @type {(
 *   root: import("./atom").ArgProgram,
 *   config: import("./config").Config,
 * ) => {
 *   root: import("./atom").ResProgram
 * }}
 */
export const weave = (root, { pointcut, initial_state, advice_variable }) => {
  switch (pointcut.type) {
    case "standard": {
      return {
        root: weaveStandard(root, {
          pointcut: pointcut.data,
          initial: initial_state,
          advice: advice_variable,
        }),
      };
    }
    case "flexible": {
      return {
        root: weaveFlexible(root, {
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
