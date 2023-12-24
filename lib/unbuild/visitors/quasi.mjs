import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.TemplateElement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildQuasi = ({ node, path }, _scope, { cooked }) =>
  makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    path,
  );
