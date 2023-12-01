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
export const makeReadCatchErrorExpression = ({ path }, context) => {
  if (context.catch) {
    return makeReadParameterExpression("catch.error", path);
  } else {
    return makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
  }
};
