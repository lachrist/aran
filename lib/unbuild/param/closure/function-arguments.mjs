import { makeReadParameterExpression } from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../report.mjs";

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @type {(
 *   context: {
 *     closure: Closure,
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
