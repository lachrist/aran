import { AranTypeError } from "../../report.mjs";
import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";

/**
 * @type {{ [key in import("./aspect").Kind]: null }}
 */
const record = {
  "block@setup": null,
  "program-block@before": null,
  "closure-block@before": null,
  "control-block@before": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "generator-block@suspension": null,
  "generator-block@resumption": null,
  "program-block@after": null,
  "closure-block@after": null,
  "control-block@after": null,
  "block@throwing": null,
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
  "apply@around": null,
  "construct@around": null,
};

export const aspect_kind_enumeration = listKey(record);

/**
 * @type {(
 *   entry: [
 *     string,
 *     null | undefined | function | { pointcut: unknown },
 *   ],
 * ) => [
 *   string,
 *   unknown | boolean,
 * ]}
 */
export const extractPointcutEntry = ([key, val]) => {
  if (typeof val === "function") {
    return [key, true];
  } else if (val == null) {
    return [key, false];
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
 *     null | undefined | function | { advice: function },
 *   ],
 * ) => [
 *   string,
 *   null | function,
 * ]}
 */
export const extractAdviceEntry = ([key, val]) => {
  if (typeof val === "function") {
    return [key, val];
  } else if (val == null) {
    return [key, null];
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
