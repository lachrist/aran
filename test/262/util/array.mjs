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
