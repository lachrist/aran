/**
 * @type {<T, D>(type: T, data: D) => {type: T, data: D}}
 */
export const makeUnion = (type, data) => ({ type, data });

/**
 * @type {<D>(
 *   wrapper: {data: D},
 * ) => D}
 */
export const getData = ({ data }) => data;

/**
 * @type {<T>(
 *   wrapper: {type: T},
 * ) => T}
 */
export const getType = ({ type }) => type;
