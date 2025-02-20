import { createWeakMap } from "./collection.mjs";

/**
 * @type {<V extends object>() => import("./size").SizeRegistery<V>}
 */
export const createSizeRegistery = () => /** @type {any} */ (createWeakMap());

/**
 * @type {<V extends object>(
 *   registery: import("./size").SizeRegistery<V>,
 *   value: V,
 * ) => import("./size").Size}
 */
export const getSize = (registery, value) =>
  /** @type {any} */ (registery).get(value) ??
  /** @type {import("./size").Size} */ (0);

/**
 * @type {<V extends object>(
 *   registery: import("./size").SizeRegistery<V>,
 *   fresh: V,
 * ) => void}
 */
export const setAtomicSize = (registery, fresh) => {
  /** @type {any} */ (registery).set(fresh, 1);
};

/**
 * @type {<V extends object>(
 *   registery: import("./size").SizeRegistery<V>,
 *   node: {
 *     callee: V;
 *     that: V;
 *     input: V[];
 *     result: V;
 *   },
 * ) => import("./size").Size}
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
  return /** @type {import("./size").Size} */ (size);
};

/**
 * @type {<V extends object>(
 *   registery: import("./size").SizeRegistery<V>,
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
