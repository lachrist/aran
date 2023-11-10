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
export const makeReadFunctionArgumentsExpression = ({ param }, { path }) =>
  param.function.type === "none" && param.arrow !== "arrow"
    ? makeSyntaxErrorExpression("Illegal 'function.arguments' read", path)
    : makeReadParameterExpression("function.arguments", path);
