import { makeReadParameterExpression } from "../node.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportExpression = ({ path }, _context) =>
  makeReadParameterExpression("import", path);
