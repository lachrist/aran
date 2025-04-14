const {
  Reflect: { defineProperty },
  WeakMap,
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap },
  },
  WeakSet,
  WeakSet: {
    prototype: { add: addWeakSet, has: hasWeakSet },
  },
} = globalThis;

const descriptor = {
  __proto__: null,
  value: /** @type {unknown} */ (null),
  writable: false,
  enumerable: false,
};

/**
 * @type {<K extends object, V>() => import("./collection.js").WeakMap<K, V>}
 */
export const createWeakMap = () => {
  const collection = new WeakMap();
  descriptor.value = getWeakMap;
  defineProperty(collection, "get", descriptor);
  descriptor.value = setWeakMap;
  defineProperty(collection, "set", descriptor);
  return /** @type {any} */ (collection);
};

/**
 * @type {<K extends object>() => import("./collection.js").WeakSet<K>}
 */
export const createWeakSet = () => {
  const collection = new WeakSet();
  descriptor.value = addWeakSet;
  defineProperty(collection, "add", descriptor);
  descriptor.value = hasWeakSet;
  defineProperty(collection, "has", descriptor);
  return /** @type {any} */ (collection);
};
