import { makeReadParameterExpression } from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";

/**
 * @type {(
 *   context: {
 *     param: {
 *       closure: import("./closure.d.ts").Closure,
 *       arrow: import("./arrow.d.ts").Arrow,
 *     },
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadFunctionArgumentsExpression = (context, { path }) =>
  context.param.closure.type === "none" && context.param.arrow !== "arrow"
    ? makeSyntaxErrorExpression("Illegal 'function.arguments' read", path)
    : makeReadParameterExpression("function.arguments", path);
