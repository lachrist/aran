import { AranTypeError } from "../../report.mjs";
import {
  includes,
  map,
  hasOwn,
  reduceEntry,
  isIterable,
} from "../../util/index.mjs";
import { aspect_kind_enumeration } from "./aspect.mjs";

const {
  Array: { isArray, from: toArray },
} = globalThis;

/**
 * @type {(
 *   pointcut: import("./aspect").Pointcut,
 * ) => import("./aspect").NormalPointcut}
 */
export const normalizePointcut = (pointcut) => {
  if (typeof pointcut === "boolean") {
    /**
     * @type {(
     *   ... rest: unknown[]
     * ) => boolean}
     */
    const predicate = () => pointcut;
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(map(aspect_kind_enumeration, (name) => [name, predicate]))
    );
  } else if (isIterable(pointcut)) {
    const array = isArray(pointcut) ? pointcut : toArray(pointcut);
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(
        map(aspect_kind_enumeration, (name) => {
          const cut = includes(array, name);
          return [name, () => cut];
        }),
      )
    );
  } else if (typeof pointcut === "object" && pointcut !== null) {
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(
        map(aspect_kind_enumeration, (name) => {
          if (hasOwn(pointcut, name)) {
            const cut = pointcut[name];
            if (typeof cut === "function") {
              return [name, cut];
            } else if (typeof cut === "boolean") {
              return [name, () => cut];
            } else if (cut == null) {
              return [name, () => false];
            } else {
              throw new AranTypeError(cut);
            }
          } else {
            return [name, () => false];
          }
        }),
      )
    );
  } else {
    throw new AranTypeError(pointcut);
  }
};
