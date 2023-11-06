import { drill } from "../../drill.mjs";
import { splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.VariableDeclarator,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDeclarator = ({ node, path }, context, { meta }) => {
  const metas = splitMeta(meta, ["id", "init"]);
  return unbuildPatternStatement(drill({ node, path }, "id"), context, {
    meta: metas.id,
    right: hasInit(node)
      ? unbuildExpression(drill({ node, path }, "init"), context, {
          meta: metas.init,
          name:
            node.id.type === "Identifier"
              ? {
                  type: "static",
                  kind: "scope",
                  base: /** @type {estree.Variable} */ (node.id.name),
                }
              : ANONYMOUS,
        })
      : makePrimitiveExpression({ undefined: null }, path),
  });
};
