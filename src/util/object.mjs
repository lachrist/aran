const {
  undefined,
  Reflect: {getOwnPropertyDescriptor},
} = globalThis;

export const get = (object, key) => object[key];

export const set = (object, key, value) => {
  object[key] = value;
};

export const hasOwnProperty = (object, key) =>
  getOwnPropertyDescriptor(object, key) !== undefined;
