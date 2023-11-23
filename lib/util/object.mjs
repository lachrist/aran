/* c8 ignore start */

import { filter, filterOut } from "./index.mjs";

const {
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

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

/**
 * @template X
 * @template {object} O
 * @template {keyof O} K
 * @param {O} object
 * @param {K} key
 * @param {(value: O[K]) => X} map
 * @return {Omit<O, K> & {[k in K]: X}}
 */
export const mapObject = (object, key, map) => ({
  ...object,
  [key]: map(object[key]),
});

/**
 * @type {<K extends string>(
 *   key: K,
 * ) => <X>(
 *   object: { [k in K]: X },
 * ) => X}
 */
export const compileGet = (key) => (object) => object[key];

/**
 * @type {<K extends PropertyKey, V>(
 *   object: { [k in K]: V },
 *   predicate: (entry: [K, V]) => boolean,
 * ) => { [k in K]: V }}
 */
export const filterObject = (object, predicate) =>
  /** @type {any} */ (
    reduceEntry(filter(/** @type {any} */ (listEntry(object)), predicate))
  );

/**
 * @type {<K extends PropertyKey, V>(
 *   object: { [k in K]: V },
 *   predicate: (entry: [K, V]) => boolean,
 * ) => { [k in K]: V }}
 */
export const filterOutObject = (object, predicate) =>
  /** @type {any} */ (
    reduceEntry(filterOut(/** @type {any} */ (listEntry(object)), predicate))
  );

// /**
//  * @type {<X>(object: {head: X}) => X}
//  */
// export const getHead = ({ head }) => head;

// /**
//  * @type {<X>(object: {body: X}) => X}
//  */
// export const getBody = ({ body }) => body;

// /**
//  * @type {<X>(object: {static: X}) => X}
//  */
// export const getStatic = ({ static: static_ }) => static_;

// /**
//  * @type {<X>(object: {instance: X}) => X}
//  */
// export const getInstance = ({ instance }) => instance;

// // /** @type {<O extends {}, K extends PropertyKey>(object: O, key: K) => object is O & Record<K, unknown>} */
// // const has = hasOwn;

// // /** @type {{foo: number} | {bar: number}} */
// // const x = { foo: 123 };

// // if (hasOwn(x, "foo")) {
// //   2 * x.foo;
// // }
