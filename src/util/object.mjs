const {
  undefined,
  Object,
  Reflect: {getOwnPropertyDescriptor},
} = globalThis;

export const NULL_DATA_DESCRIPTOR = {
  __proto__: null,
  writable: true,
  configurable: true,
  enumerable: true,
  value: null,
};

export const get = (object, key) => object[key];

export const set = (object, key, value) => {
  object[key] = value;
};

/* c8 ignore start */
export const hasOwn =
  getOwnPropertyDescriptor(Object, "hasOwn") === undefined
    ? (object, key) => getOwnPropertyDescriptor(object, key) !== undefined
    : Object.hasOwn;
/* c8 ignore stop */
