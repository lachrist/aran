import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.TemplateElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { cooked: boolean },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildQuasi = ({ node, path }, context, { cooked }) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  return makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    serial,
  );
};
