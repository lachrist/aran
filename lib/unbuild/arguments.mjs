/**
 * @type {(
 *   value: aran.Expression<import("./atom").Atom>[],
 * ) => import("./argument").ArgumentList}
 */
export const makeSpreadArgumentList = (values) => ({
  type: "spread",
  values,
});

/**
 * @type {(
 *   value: aran.Expression<import("./atom").Atom>,
 * ) => import("./argument").ArgumentList}
 */
export const makeConcatArgumentList = (value) => ({
  type: "concat",
  value,
});
