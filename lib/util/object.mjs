/* c8 ignore start */

export const {
  Error,
  Reflect: { getOwnPropertyDescriptor },
  undefined,
  Object,
} = globalThis;

/** @type {<K extends PropertyKey>(o: object, k: K) => o is Record<K, unknown>} */
const hasOwnPolyfill = (o, k) => getOwnPropertyDescriptor(o, k) !== undefined;

export const hasOwn = hasOwnPolyfill(Object, "hasOwn")
  ? /** @type {<K extends PropertyKey>(o: object, k: K) => o is Record<K, unknown>} */ (
      Object.hasOwn
    )
  : hasOwnPolyfill;

/** @type {(obj: unknown, keys: string[]) => unknown} */
export const getDeep = (obj, keys) => {
  const { length } = keys;
  for (let index = 0; index < length; index += 1) {
    const key = keys[index];
    if (typeof obj === "object" && obj !== null && hasOwn(obj, key)) {
      obj = obj[key];
    } else {
      return undefined;
    }
  }
  return obj;
};
