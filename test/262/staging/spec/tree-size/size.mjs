const {
  Reflect: { apply },
  WeakMap,
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap },
  },
} = globalThis;

/**
 * @type {<V extends object>() => import("./size").Registery<V>}
 */
export const createSizeRegistery = () => /** @type {any} */ (new WeakMap());

/**
 * @type {<V extends object>(
 *   registery: import("./size").Registery<V>,
 *   value: V,
 * ) => import("./size").Size}
 */
export const getSize = (registery, value) =>
  apply(getWeakMap, registery, [value]) ??
  /** @type {import("./size").Size} */ (0);

/**
 * @type {<V extends object>(
 *   registery: import("./size").Registery<V>,
 *   node: import("./size").Node<V>,
 * ) => import("./size").Size}
 */
const getNodeSize = (registery, { callee, that, input, result }) => {
  /** @type {number} */
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
 *   registery: import("./size").Registery<V>,
 *   fresh: V,
 *   origin: import("./size").Node<V>,
 * ) => void}
 */
export const setSize = (registery, fresh, origin) => {
  apply(setWeakMap, registery, [fresh, getNodeSize(registery, origin)]);
};
