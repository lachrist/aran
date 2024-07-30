const {
  Object: { hasOwn },
} = globalThis;

/**
 * @type {<K extends string>(
 *   obj:  {[key in string]: import("./json").Json},
 *   key: K,
 * ) => obj is {[k in K]: import("./json").Json}}
 */
export const hasOwnJson = /** @type {any} */ (hasOwn);
