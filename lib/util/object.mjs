/* c8 ignore start */

export const {
  Error,
  Reflect: { getOwnPropertyDescriptor },
  undefined,
  Object: { hasOwn = (o, k) => getOwnPropertyDescriptor(o, k) !== undefined },
} = globalThis;

/** @type {(obj: unknown, keys: string[]) => unknown} */
export const getDeep = (obj, keys) => {
  const { length } = keys;
  for (let index = 0; index < length; index += 1) {
    const key = keys[index];
    if (typeof obj === "object" && obj !== null && hasOwn(obj, key)) {
      // @ts-ignore
      obj = obj[key];
    } else {
      return undefined;
    }
  }
  return obj;
};
