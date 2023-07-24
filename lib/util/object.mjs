/* c8 ignore start */

export const {
  Reflect: { getOwnPropertyDescriptor },
  undefined,
  Object: { hasOwn = (o, k) => getOwnPropertyDescriptor(o, k) !== undefined },
} = globalThis;
