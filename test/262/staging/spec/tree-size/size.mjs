import { createWeakMap } from "./collection.mjs";

/**
 * @type {<V extends object>() => import("./size.d.ts").SizeRegistery<V>}
 */
export const createSizeRegistery = () => /** @type {any} */ (createWeakMap());

/**
 * @type {<V extends object>(
 *   registery: import("./size.d.ts").SizeRegistery<V>,
 *   value: V,
 * ) => import("./size.d.ts").Size}
 */
export const getSize = (registery, value) =>
  /** @type {any} */ (registery).get(value) ??
  /** @type {import("./size.d.ts").Size} */ (0);

/**
 * @type {<V extends object>(
 *   registery: import("./size.d.ts").SizeRegistery<V>,
 *   fresh: V,
 * ) => void}
 */
export const setAtomicSize = (registery, fresh) => {
  /** @type {any} */ (registery).set(fresh, 1);
};

/**
 * @type {<V extends object>(
 *   registery: import("./size.d.ts").SizeRegistery<V>,
 *   node: {
 *     callee: V;
 *     that: V;
 *     input: V[];
 *     result: V;
 *   },
 * ) => import("./size.d.ts").Size}
 */
const getCompoundSize = (registery, { callee, that, input, result }) => {
  let size = 1;
  size += getSize(registery, callee);
  size += getSize(registery, that);
  const { length } = input;
  for (let index = 0; index < length; index++) {
    size += getSize(registery, input[index]);
  }
  size += getSize(registery, result);
  return /** @type {import("./size.d.ts").Size} */ (size);
};

/**
 * @type {<V extends object>(
 *   registery: import("./size.d.ts").SizeRegistery<V>,
 *   fresh: V,
 *   node: {
 *     callee: V;
 *     that: V;
 *     input: V[];
 *     result: V;
 *   },
 * ) => void}
 */
export const setCompoundSize = (registery, fresh, origin) => {
  /** @type {any} */ (registery).set(fresh, getCompoundSize(registery, origin));
};
