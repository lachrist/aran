import { makeReadParameterExpression } from "../node.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       kind: "module" | "script" | "eval",
 *     },
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadImportMetaExpression = ({ path }, context) =>
  context.root.kind === "module"
    ? makeReadParameterExpression("import.meta", path)
    : makeSyntaxErrorExpression("Illegal 'import.meta' read", path);
