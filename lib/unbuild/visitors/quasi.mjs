import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {(
 *   site: {
 *     node: estree.TemplateElement,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildQuasi = ({ node, path }, _context, { cooked }) =>
  makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    path,
  );
