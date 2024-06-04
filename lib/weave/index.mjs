import { weave as weaveStandard } from "./standard/index.mjs";
import { weave as weaveFlexible } from "./flexible/index.mjs";
import { AranTypeError } from "../error.mjs";

export { aspect_kind_enumeration as standard_aspect_kind_enumeration } from "./standard/index.mjs";
export { aspect_kind_enumeration as flexible_aspect_kind_enumeration } from "./flexible/index.mjs";

/**
 * @type {(
 *   program: {
 *     root: import("./atom").ArgProgram,
 *     evals: {
 *       [k in import("../path").Path]
 *         ?: import("../program").DeepLocalContext
 *     },
 *   },
 *   config:  import("./config").Config,
 * ) => {
 *   root: import("./atom").ResProgram,
 * }}
 */
export const weave = (program, config) => {
  switch (config.weave) {
    case "standard": {
      return weaveStandard(program, config);
    }
    case "flexible": {
      return weaveFlexible(program, config);
    }
    default: {
      throw new AranTypeError(config);
    }
  }
};
