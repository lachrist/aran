import { AranTypeError } from "../../error.mjs";
import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";

/**
 * @type {{ [key in import("./aspect").AspectKind]: null }}
 */
const record = {
  "block@setup": null,
  "block@frame": null,
  "block@overframe": null,
  "block@success": null,
  "block@failure": null,
  "block@teardown": null,
  "break@before": null,
  "test@before": null,
  "intrinsic@after": null,
  "primitive@after": null,
  "import@after": null,
  "closure@after": null,
  "read@after": null,
  "eval@before": null,
  "eval@after": null,
  "await@before": null,
  "await@after": null,
  "yield@before": null,
  "yield@after": null,
  "drop@before": null,
  "export@before": null,
  "write@before": null,
  "return@before": null,
  "apply@around": null,
  "construct@around": null,
};

export const aspect_kind_enumeration = listKey(record);

/**
 * @type {(
 *   entry: [
 *     string,
 *     function | { pointcut: unknown },
 *   ],
 * ) => [
 *   string,
 *   unknown | boolean,
 * ]}
 */
export const extractPointcutEntry = ([key, val]) => {
  if (typeof val === "function") {
    return [key, true];
  } else if (typeof val === "object" && val !== null) {
    return [key, val.pointcut];
  } else {
    throw new AranTypeError(val);
  }
};

/**
 * @type {<X, V extends import("./aspect").Valuation>(
 *   aspect: import("./aspect").Aspect<X, V>,
 * ) => import("./aspect").ObjectPointcut}
 */
export const extractPointcut = (aspect) =>
  /** @type {any} */ (
    reduceEntry(map(listEntry(aspect), extractPointcutEntry))
  );

/**
 * @type {(
 *   entry: [
 *     string,
 *     function | { advice: function },
 *   ],
 * ) => [
 *   string,
 *   function,
 * ]}
 */
export const extractAdviceEntry = ([key, val]) => {
  if (typeof val === "function") {
    return [key, val];
  } else if (typeof val === "object" && val !== null) {
    return [key, val.advice];
  } else {
    throw new AranTypeError(val);
  }
};

/**
 * @type {<X, V extends import("./aspect").Valuation>(
 *   aspect: import("./aspect").Aspect<X, V>,
 * ) => unknown}
 */
export const extractAdvice = (aspect) =>
  reduceEntry(map(listEntry(aspect), extractAdviceEntry));
