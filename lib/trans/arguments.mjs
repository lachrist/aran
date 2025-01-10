/**
 * @type {(
 *   value: import("./atom").Expression[],
 * ) => import("./argument").ArgumentList}
 */
export const makeSpreadArgumentList = (values) => ({
  type: "spread",
  values,
});

/**
 * @type {(
 *   value: import("./atom").Expression,
 * ) => import("./argument").ArgumentList}
 */
export const makeConcatArgumentList = (value) => ({
  type: "concat",
  value,
});
