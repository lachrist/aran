/**
 * @type {(
 *   value: import("./atom.d.ts").Expression[],
 * ) => import("./argument.d.ts").ArgumentList}
 */
export const makeSpreadArgumentList = (values) => ({
  type: "spread",
  values,
});

/**
 * @type {(
 *   value: import("./atom.d.ts").Expression,
 * ) => import("./argument.d.ts").ArgumentList}
 */
export const makeConcatArgumentList = (value) => ({
  type: "concat",
  value,
});
