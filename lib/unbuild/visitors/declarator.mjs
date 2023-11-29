import { drill } from "../site.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { isNameSite, isNotNullishSite } from "../predicate.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildInitializePatternEffect } from "./pattern.mjs";
import { listScopeInitializeEffect } from "../scope/index.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.VariableDeclarator>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildDeclarator = ({ node, path, meta }, context, {}) => {
  if (node.init == null && node.id.type === "Identifier") {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeInitializeEffect({ path, meta }, context, {
      variable: /** @type {estree.Variable} */ (node.id.name),
      right: null,
    });
  } else {
    const sites = drill({ node, path, meta }, ["id", "init"]);
    return unbuildInitializePatternEffect(sites.id, context, {
      right: isNotNullishSite(sites.init)
        ? isNameSite(sites.init)
          ? unbuildNameExpression(sites.init, context, {
              name: makePrimitiveExpression(
                node.id.type === "Identifier" ? node.id.name : "",
                path,
              ),
            })
          : unbuildExpression(sites.init, context, {})
        : makePrimitiveExpression({ undefined: null }, path),
    });
  }
};
