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
export const map = (array, transform) =>
  toArray(
    {
      // @ts-ignore
      __proto__: null,
      length: array.length,
    },
    (_, index) => transform(array[index]),
  );

/**
 * @type {<X, Y>(
 *   array: X[],
 *   accumulate: (result: Y, item: X) => Y,
 *   initial: Y,
 * ) => Y}
 */
export const reduce = (array, accumulate, result) => {
  const { length } = array;
  for (let index = 0; index < length; index++) {
    result = accumulate(result, array[index]);
  }
  return result;
};

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
