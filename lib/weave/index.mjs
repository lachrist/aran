import { weave as weaveStandard } from "./standard/index.mjs";
import { weave as weaveFlexible } from "./flexible/index.mjs";
import { AranInputError } from "../error.mjs";

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
 *   config: import("./config").InternalConfig,
 * ) => import("./atom").ResProgram
 * }
 */
export const weave = (
  root,
  { standard_pointcut, flexible_pointcut, initial_state, advice_variable },
) => {
  if (standard_pointcut !== null && flexible_pointcut !== null) {
    throw new AranInputError({
      conditions: [
        {
          target: "conf.flexible_pointcut",
          actual: flexible_pointcut,
        },
      ],
      target: "conf.standard_pointcut",
      actual: standard_pointcut,
      expect: "null",
    });
  }
  if (standard_pointcut !== null) {
    return weaveStandard(root, {
      pointcut: standard_pointcut,
      initial_state,
      advice_variable,
    });
  }
  if (flexible_pointcut !== null) {
    return weaveFlexible(root, {
      pointcut: flexible_pointcut,
      initial_state,
    });
  }
  throw new AranInputError({
    conditions: [
      {
        target: "conf.flexible_pointcut",
        actual: flexible_pointcut,
      },
    ],
    target: "conf.standard_pointcut",
    actual: standard_pointcut,
    expect: "not null",
  });
};
