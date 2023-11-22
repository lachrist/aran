import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     catch: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadCatchErrorExpression = ({ path }, context) =>
  context.catch
    ? makeReadParameterExpression("catch.error", path)
    : makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
