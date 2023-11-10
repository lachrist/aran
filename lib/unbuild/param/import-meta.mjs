import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

/**
 * @type {(
 *   context: {
 *     root: {
 *       kind: "module" | "script" | "eval",
 *     },
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportMetaExpression = ({ root: { kind } }, { path }) =>
  kind === "module"
    ? makeReadParameterExpression("import.meta", path)
    : makeSyntaxErrorExpression("Illegal 'import.meta' read", path);
