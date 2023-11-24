const { String } = globalThis;
/**
 * @type {(
 *   node: estree.Literal,
 * ) => estree.Source}
 */
export const getSource = (node) =>
  /** @type {estree.Source} */ (String(node.value));

export const DUMMY_SOURCE = /** @type {estree.Source} */ (
  "_ARAN_DUMMY_SOURCE_"
);
