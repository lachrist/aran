import { AranTypeError } from "../../error.mjs";
import {
  includes,
  map,
  hasOwn,
  listKey,
  reduceEntry,
} from "../../util/index.mjs";

const {
  Symbol: { iterator },
  Array: { isArray, from: toArray },
} = globalThis;

/** @type {(any: any) => any is Iterable<any>} */
const isIterable = (any) => any != null && typeof any[iterator] === "function";

/**
 * @type {{ [key in keyof import("./pointcut").NormalPointcut]: null }}
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

const names = listKey(record);

/**
 * @type {(
 *   pointcut: import("./pointcut").Pointcut,
 * ) => import("./pointcut").NormalPointcut}
 */
export const normalizePointcut = (pointcut) => {
  if (typeof pointcut === "boolean") {
    /**
     * @type {(
     *   ... rest: unknown[]
     * ) => boolean}
     */
    const predicate = () => pointcut;
    return /** @type {import("./pointcut").NormalPointcut} */ (
      reduceEntry(map(names, (name) => [name, predicate]))
    );
  } else if (isIterable(pointcut)) {
    const array = isArray(pointcut) ? pointcut : toArray(pointcut);
    return /** @type {import("./pointcut").NormalPointcut} */ (
      reduceEntry(
        map(names, (name) => {
          const cut = includes(array, name);
          return [name, () => cut];
        }),
      )
    );
  } else if (typeof pointcut === "object" && pointcut !== null) {
    return /** @type {import("./pointcut").NormalPointcut} */ (
      reduceEntry(
        map(names, (name) => {
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
