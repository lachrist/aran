/**
 * @type {(
 *   guard: boolean,
 *   root: estree.Program & {
 *     warnings: import("../../../../lib/unbuild/warning").Warning[],
 *   },
 * ) => estree.Program}
 */
export const warn = (guard, root) => {
  if (guard) {
    for (const warning of root.warnings) {
      // eslint-disable-next-line no-console
      console.warn(warning);
    }
  }
  return root;
};
