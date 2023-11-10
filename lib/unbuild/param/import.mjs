import { makeReadParameterExpression } from "../node.mjs";

/**
 * @type {(
 *   context: {},
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportExpression = (_context, { path }) =>
  makeReadParameterExpression("import", path);
