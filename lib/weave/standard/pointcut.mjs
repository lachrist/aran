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
      reduceEntry(map(aspect_kind_enumeration, (kind) => [kind, predicate]))
    );
  } else if (isIterable(pointcut)) {
    const array = isArray(pointcut) ? pointcut : toArray(pointcut);
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(
        map(aspect_kind_enumeration, (kind) => {
          const cut = includes(array, kind);
          return [kind, () => cut];
        }),
      )
    );
  } else if (typeof pointcut === "function") {
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(
        map(aspect_kind_enumeration, (kind) => [
          kind,
          /**
           * @type {(
           *   ...input: unknown[],
           * ) => boolean}
           */
          (...input) =>
            pointcut(
              kind,
              /** @type {import("../../hash").Hash} */ (
                input[input.length - 1]
              ),
            ),
        ]),
      )
    );
  } else if (typeof pointcut === "object" && pointcut !== null) {
    return /** @type {import("./aspect").NormalPointcut} */ (
      reduceEntry(
        map(aspect_kind_enumeration, (kind) => {
          if (hasOwn(pointcut, kind)) {
            const cut = pointcut[kind];
            if (typeof cut === "function") {
              return [kind, cut];
            } else if (typeof cut === "boolean") {
              return [kind, () => cut];
            } else if (cut == null) {
              return [kind, () => false];
            } else {
              throw new AranTypeError(cut);
            }
          } else {
            return [kind, () => false];
          }
        }),
      )
    );
  } else {
    throw new AranTypeError(pointcut);
  }
};
