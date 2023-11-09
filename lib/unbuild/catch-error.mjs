import { makeReadParameterExpression } from "./node.mjs";
import { makeSyntaxErrorExpression } from "./report.mjs";

/**
 * @type {(
 *   context: {
 *     "catch.error": boolean,
 *   },
 *   site: {path: unbuild.Path},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCatchErrorExpression = (
  { ["catch.error"]: legal },
  { path },
) =>
  legal
    ? makeReadParameterExpression("catch.error", path)
    : makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
