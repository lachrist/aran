const { String } = globalThis;
/**
 * @type {(
 *   node: import("../../estree").Literal,
 * ) => import("../../estree").Source}
 */
export const getSource = (node) =>
  /** @type {import("../../estree").Source} */ (String(node.value));

export const DUMMY_SOURCE = /** @type {import("../../estree").Source} */ (
  "_ARAN_DUMMY_SOURCE_"
);
