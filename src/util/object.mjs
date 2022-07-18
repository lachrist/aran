const {
  undefined,
  Object,
  Reflect: {getOwnPropertyDescriptor},
} = globalThis;

export const get = (object, key) => object[key];

export const set = (object, key, value) => {
  object[key] = value;
};

/* c8 ignore start */
export const hasOwnProperty =
  getOwnPropertyDescriptor(Object, "hasOwn") === undefined
    ? (object, key) => getOwnPropertyDescriptor(object, key) !== undefined
    : Object.hasOwn;
/* c8 ignore stop */
