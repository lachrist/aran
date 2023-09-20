/* c8 ignore start */

// export const {
//   Error,
//   Reflect: { getOwnPropertyDescriptor },
//   undefined,
//   Object,
// } = globalThis;

// /** @type {<K extends PropertyKey>(o: object, k: K) => o is Record<K, unknown>} */
// const hasOwnPolyfill = (o, k) => getOwnPropertyDescriptor(o, k) !== undefined;

// export const hasOwn = hasOwnPolyfill(Object, "hasOwn")
//   ? /** @type {<K extends PropertyKey>(o: object, k: K) => o is Record<K, unknown>} */ (
//       Object.hasOwn
//     )
//   : hasOwnPolyfill;

export const {
  Error,
  Reflect: { getOwnPropertyDescriptor },
  undefined,
  Object,
} = globalThis;

/** @type {(o: object, k: PropertyKey) => boolean} */
const hasOwnPolyfill = (o, k) => getOwnPropertyDescriptor(o, k) !== undefined;

export const hasOwn = hasOwnPolyfill(Object, "hasOwn")
  ? Object.hasOwn
  : hasOwnPolyfill;

// /** @type {<O extends {}, K extends PropertyKey>(object: O, key: K) => object is O & Record<K, unknown>} */
// const has = hasOwn;

// /** @type {{foo: number} | {bar: number}} */
// const x = { foo: 123 };

// if (hasOwn(x, "foo")) {
//   2 * x.foo;
// }
