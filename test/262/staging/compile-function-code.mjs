const {
  Array: {
    from: toArray,
    prototype: { pop, join },
  },
  Reflect: { apply },
  String,
} = globalThis;

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (item: X) => Y,
 * ) => Y[]}
 */
const map = (array, transform) =>
  toArray({ length: array.length }, (_, index) => transform(array[index]));

/**
 * @type {(
 *   input: unknown[],
 * ) => string}
 */
export const compileFunctionCode = (input) => {
  if (input.length === 0) {
    return "(function anonymous() {\n})";
  } else {
    const parts = map(input, String);
    const body = apply(pop, parts, []);
    const params = apply(join, parts, [","]);
    return `(function anonymous(${params}\n) {\n${body}\n})`;
  }
};
