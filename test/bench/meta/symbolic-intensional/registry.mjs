const {
  WeakMap,
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap, has: hasWeakMap },
  },
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {() => import("./registry.js").Registry}
 */
export const createRegistry = () => {
  const registry = new WeakMap();
  defineProperty(registry, "$has", {
    // @ts-ignore
    __proto__: null,
    value: hasWeakMap,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  defineProperty(registry, "$get", {
    // @ts-ignore
    __proto__: null,
    value: getWeakMap,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  defineProperty(registry, "$set", {
    // @ts-ignore
    __proto__: null,
    value: setWeakMap,
    writable: false,
    enumerable: false,
    configurable: false,
  });
  return /** @type {any} */ (registry);
};
