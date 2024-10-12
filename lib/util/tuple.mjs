/**
 * @type {() => []}
 */
export const tuple0 = () => [];

/**
 * @type {<X1>(
 *   x1: X1,
 * ) => [X1]}
 */
export const tuple1 = (x1) => [x1];

/**
 * @type {<X1, X2>(
 *   x1: X1,
 *   x2: X2,
 * ) => [X1, X2]}
 */
export const tuple2 = (x1, x2) => [x1, x2];

/**
 * @type {<X1, X2, X3>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 * ) => [X1, X2, X3]}
 */
export const tuple3 = (x1, x2, x3) => [x1, x2, x3];

/**
 * @type {<X>(
 *   tuple: [X, ...unknown[]],
 * ) => X}
 */
export const get0 = (tuple) => tuple[0];

/**
 * @type {<X>(
 *   tuple: [unknown, X, ...unknown[]],
 * ) => X}
 */
export const get1 = (tuple) => tuple[1];

/**
 * @type {<X>(
 *   tuple: [unknown, unknown, X, ...unknown[]],
 * ) => X}
 */
export const get2 = (tuple) => tuple[2];
