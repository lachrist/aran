const {
  Reflect: { defineProperty },
  WeakMap,
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap },
  },
} = globalThis;

const descriptor = {
  __proto__: null,
  value: /** @type {unknown} */ (null),
  writable: false,
  enumerable: false,
};

/**
 * @type {<K extends object, V>() => import("./collection.d.ts").WeakMap<K, V>}
 */
export const createWeakMap = () => {
  const collection = new WeakMap();
  descriptor.value = getWeakMap;
  defineProperty(collection, "get", descriptor);
  descriptor.value = setWeakMap;
  defineProperty(collection, "set", descriptor);
  return /** @type {any} */ (collection);
};
