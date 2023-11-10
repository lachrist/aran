import { makeReadParameterExpression } from "../node.mjs";

/**
 * @type {(
 *   context: {
 *     param: import("./param.d.ts").Param,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportExpression = (_context, { path }) =>
  makeReadParameterExpression("import", path);
