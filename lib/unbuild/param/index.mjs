import { makeSimpleParameterExpression } from "./simple.mjs";

/**
 * @type {(
 *   parameter: (
 *     | "new.target"
 *     | "catch.error"
 *     | "function.arguments"
 *     | "import.dynamic"
 *     | "import.meta"
 *   ),
 * ) => (
 *   strict: boolean,
 *   param: import("./param.js").Param,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const compileMakeSimpleParameterExpression =
  (parameter) => (strict, param, site) =>
    makeSimpleParameterExpression(strict, param, parameter, site);

export const makeNewTargetExpression =
  compileMakeSimpleParameterExpression("new.target");

export const makeCatchErrorExpression =
  compileMakeSimpleParameterExpression("catch.error");

export const makeFunctionArgumentsExpression =
  compileMakeSimpleParameterExpression("function.arguments");

export const makeImportDynamicExpression =
  compileMakeSimpleParameterExpression("import.dynamic");

export const makeImportMetaExpression =
  compileMakeSimpleParameterExpression("import.meta");
