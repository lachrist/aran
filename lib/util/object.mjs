const {
  Reflect: { getOwnPropertyDescriptor, defineProperty },
  undefined,
  Object,
  Object: { create: createObject, keys, values, entries, fromEntries },
} = globalThis;

/**
 * @type {<K extends PropertyKey, V>(
 * ) => Record<K, V>}
 */
export const createRecord = () => createObject(null);

/**
 * @type {<K extends string | number>(
 *   key: K,
 * ) => <X>(
 *   object: { [k in K]: X },
 * ) => X}
 */
export const compileGet = (key) => (object) => object[key];

/**
 * @type {<K extends string, V>(
 *   record: { [k in K]?: V },
 * ) => [K, V][]}
 */
export const listEntry = entries;

/**
 * @type {<K extends string, V>(
 *   entries: [K, V][],
 * ) => { [k in K]?: V }}
 */
export const reduceEntry = fromEntries;

/**
 * @type {<K extends string, V>(
 *   entries: [K, V][],
 * ) => { [k in K]: V }}
 */
export const reduceEntryTotal = fromEntries;

/**
 * @type {<K extends string, V>(
 *   partial: { [k in K]?: V },
 * ) => K[]}
 */
export const listKey = keys;

/**
 * @type {<K extends string, V>(
 *   partial: { [k in K]?: V },
 * ) => V[]}
 */
export const listValue = values;

/**
 * @type {(
 *   object: object,
 *   key: PropertyKey,
 * ) => boolean}
 */
const hasOwnPolyfill = (object, key) =>
  getOwnPropertyDescriptor(object, key) !== undefined;

/**
 * @type {<K1 extends PropertyKey, K2 extends K1, V>(
 *   record: { [k in K1]?: V },
 *   key: K2,
 * ) => record is ({ [k in K1]?: V } & { [k in K2]: V })}
 */
export const hasOwn = /** @type {any} */ (
  hasOwnPolyfill(Object, "hasOwn") ? Object.hasOwn : hasOwnPolyfill
);

/**
 * @type {<O extends object, K extends PropertyKey>(
 *   object: O,
 *   key: K,
 * ) => object is (O & { [k in K]: unknown })}
 */
export const hasNarrowObject = /** @type {any} */ (hasOwn);

/**
 * @type {<K1 extends PropertyKey, K2 extends PropertyKey, V>(
 *   object: { [k in K1] ?: V },
 *   key: K2,
 * ) => key is K2 & K1}
 */
export const hasNarrowKey = /** @type {any} */ (hasOwn);

/**
 * @type {<K extends PropertyKey, V>(
 *   record: { [k in K]?: V },
 *   key: K,
 * ) => V | undefined}
 */
export const getOwn = (record, key) =>
  hasOwn(record, key) ? record[key] : undefined;

/* eslint-disable local/no-impure */
/**
 * @type {<K extends PropertyKey, V>(
 *   record: { [k in K]?: V },
 *   key: K,
 *   value: V,
 * ) => void}
 */
export const setOwn = (record, key, value) => {
  defineProperty(
    record,
    key,
    /** @type {any} */ ({
      __proto__: null,
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    }),
  );
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {<K extends PropertyKey, V>(
 *   record: { [k in K]?: V },
 *   key: K,
 * ) => void}
 */
export const deleteOwn = (record, key) => {
  if (hasOwn(record, key)) {
    delete record[key];
  }
};
/* eslint-enable local/no-impure */
