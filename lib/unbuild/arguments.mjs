/**
 * @type {(
 *   value: aran.Expression<unbuild.Atom>[],
 * ) => import("./argument").ArgumentList}
 */
export const makeSpreadArgumentList = (values) => ({
  type: "spread",
  values,
});

/**
 * @type {(
 *   value: aran.Expression<unbuild.Atom>,
 * ) => import("./argument").ArgumentList}
 */
export const makeConcatArgumentList = (value) => ({
  type: "concat",
  value,
});
