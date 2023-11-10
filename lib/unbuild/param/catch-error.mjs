import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

/**
 * @type {(
 *   context: {
 *     catch: boolean,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadCatchErrorExpression = ({ catch: catch_ }, { path }) =>
  catch_
    ? makeReadParameterExpression("catch.error", path)
    : makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
