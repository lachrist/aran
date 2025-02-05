const { Error, Array } = globalThis;

/**
 * @type {<X>(
 *   array: X[],
 * ) => array is [X, ...X[]]}
 */
export const isNotEmptyArray = (array) => array.length > 0;

/**
 * @type {<X>(array: [X, ...X[]]) => X}
 */
export const shift = (array) => /** @type {any} */ (array.shift());

/**
 * @type {<X>(array: [X, ...X[]]) => X}
 */
export const pop = (array) => /** @type {any} */ (array.pop());

/**
 * @type {(
 *   length: number,
 * ) => ArrayLike<undefined>}
 */
const createEmptyArrayLike = (length) =>
  /** @type {any} */ ({ __proto__: null, length });

/**
 * @type {<X>(
 *   length: number,
 *   createItem: (value: undefined, index: number) => X,
 * ) => X[]}
 */
export const createArray = (length, createItem) =>
  Array.from(createEmptyArrayLike(length), createItem);

/**
 * @template X
 * @param {X[][]} matrix
 * @returns {X[][]}
 */
export const transpose = (matrix) => {
  const { length: length1 } = matrix;
  if (length1 === 0) {
    return [];
  } else {
    const { length: length2 } = matrix[0];
    for (let index1 = 1; index1 < length1; index1++) {
      if (matrix[index1].length !== length2) {
        throw new Error("matrix length mismatch");
      }
    }
    /** @type {any[][]} */
    const result = createArray(length2, () =>
      Array.from(createEmptyArrayLike(length1)),
    );
    for (let index1 = 0; index1 < length1; index1++) {
      for (let index2 = 0; index2 < length2; index2++) {
        result[index2][index1] = matrix[index1][index2];
      }
    }
    return result;
  }
};
