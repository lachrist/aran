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
export const makeReadCatchErrorExpression = ({ param }, { path }) =>
  param.catch
    ? makeReadParameterExpression("catch.error", path)
    : makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
