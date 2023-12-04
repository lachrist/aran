import { makeReadParameterExpression } from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";

/**
 * @type {(
 *   context: {
 *     closure: import("./closure.d.ts").Closure,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadFunctionArgumentsExpression = ({ closure }, { path }) =>
  closure.type === "none" && closure.arrow !== "arrow"
    ? makeSyntaxErrorExpression("Illegal 'function.arguments' read", path)
    : makeReadParameterExpression("function.arguments", path);
