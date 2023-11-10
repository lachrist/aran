import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

/**
 * @type {(
 *   context: {
 *     program: "module" | "script" | "eval",
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportMetaExpression = ({ program }, { path }) =>
  program === "module"
    ? makeReadParameterExpression("import.meta", path)
    : makeSyntaxErrorExpression("Illegal 'import.meta' read", path);
