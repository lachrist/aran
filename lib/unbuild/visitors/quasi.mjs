import { getPath } from "../annotate.mjs";
import { makePrimitiveExpression } from "../node.mjs";

/**
 * @type {<S>(
 *   node: estree.TemplateElement,
 *   context: import("../context.js").Context<S>,
 *   options: { cooked: boolean },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildQuasi = (node, context, { cooked }) => {
  const { serialize } = context;
  const serial = serialize(node, context.root, getPath(node));
  return makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    serial,
  );
};
