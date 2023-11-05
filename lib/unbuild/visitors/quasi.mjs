import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.TemplateElement,
 *     path: unbuild.Path,
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
