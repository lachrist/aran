import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

/**
 * @type {(
 *   strict: boolean,
 *   parametrization: import("./param.js").Param,
 *   parameter: (
 *     | "import.dynamic"
 *     | "new.target"
 *     | "function.arguments"
 *     | "import.meta"
 *     | "catch.error"
 *   ),
 *   site: { path: unbuild.Path },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSimpleParameterExpression = (
  _strict,
  param,
  parameter,
  { path },
) =>
  param[parameter]
    ? makeReadParameterExpression(
        parameter === "import.dynamic" ? "import" : parameter,
        path,
      )
    : makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
