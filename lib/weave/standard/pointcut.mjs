import { AranTypeError } from "../../error.mjs";
import {
  includes,
  hasOwn,
  isIterable,
  return$,
  recordArrayTotal,
  constant1,
  constant,
} from "../../util/index.mjs";
import { aspect_kind_enumeration } from "./aspect.mjs";

const {
  Array: { isArray, from: toArray },
} = globalThis;

const returnTrue = constant(true);

const returnFalse = constant(false);

const returnReturnTrue = constant1(returnTrue);

const returnReturnFalse = constant1(returnFalse);

/**
 * @type {(
 *   pointcut: import("./aspect").Pointcut<import("../../hash").Hash>,
 * ) => import("./aspect").NormalPointcut}
 */
export const normalizePointcut = (pointcut) => {
  if (typeof pointcut === "boolean") {
    return recordArrayTotal(
      aspect_kind_enumeration,
      return$,
      pointcut ? returnReturnTrue : returnReturnFalse,
    );
  } else if (isIterable(pointcut)) {
    const array = isArray(pointcut) ? pointcut : toArray(pointcut);
    return recordArrayTotal(aspect_kind_enumeration, return$, (kind) =>
      constant(includes(array, kind)),
    );
  } else if (typeof pointcut === "function") {
    return recordArrayTotal(
      aspect_kind_enumeration,
      return$,
      (kind) =>
        /**
         * @type {(
         *   ...input: unknown[],
         * ) => boolean}
         */
        (...input) =>
          pointcut(
            kind,
            /** @type {import("../../hash").Hash} */ (input[input.length - 1]),
          ),
    );
  } else if (typeof pointcut === "object" && pointcut !== null) {
    return recordArrayTotal(aspect_kind_enumeration, return$, (kind) => {
      if (hasOwn(pointcut, kind)) {
        const cut = pointcut[kind];
        if (typeof cut === "function") {
          return /** @type {(...rest: unknown[]) => boolean} */ (cut);
        } else if (typeof cut === "boolean") {
          return constant(cut);
        } else if (cut == null) {
          return returnFalse;
        } else {
          throw new AranTypeError(cut);
        }
      } else {
        return returnFalse;
      }
    });
  } else {
    throw new AranTypeError(pointcut);
  }
};
