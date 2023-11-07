import { drill } from "../../drill.mjs";
import { splitMeta } from "../mangle.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildNameExpression } from "./expression.mjs";
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
      ? unbuildNameExpression(drill({ node, path }, "init"), context, {
          meta: metas.init,
          name: makePrimitiveExpression(
            node.id.type === "Identifier" ? node.id.name : "",
            path,
          ),
        })
      : makePrimitiveExpression({ undefined: null }, path),
  });
};
