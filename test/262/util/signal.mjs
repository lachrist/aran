/* eslint-disable local/no-function */

/**
 * @type {<X>(
 *   this: { value: X },
 * ) => X}
 */
export const getSignal = function () {
  return this.value;
};

/**
 * @type {<X>(
 *   initial: X,
 * ) => {
 *   value: X,
 *   get (this: { value: X }): X,
 * }}
 */
export const createSignal = (initial) => ({
  value: initial,
  get: getSignal,
});
