import { drill } from "../site.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.VariableDeclarator>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDeclarator = ({ node, path, meta }, context, {}) => {
  const sites = drill({ node, path, meta }, ["id", "init"]);
  return unbuildPatternStatement(sites.id, context, {
    right: isNotNullishSite(sites.init)
      ? unbuildNameExpression(sites.init, context, {
          name: makePrimitiveExpression(
            node.id.type === "Identifier" ? node.id.name : "",
            path,
          ),
        })
      : makePrimitiveExpression({ undefined: null }, path),
  });
};
