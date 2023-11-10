import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

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
export const makeReadImportMetaExpression = ({ param }, { path }) =>
  param.program === "module"
    ? makeReadParameterExpression("import.meta", path)
    : makeSyntaxErrorExpression("Illegal 'import.meta' read", path);
