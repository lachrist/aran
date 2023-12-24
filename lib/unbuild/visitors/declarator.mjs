import { drillSite } from "../site.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildInitializePatternEffect } from "./pattern.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { cacheConstant, cachePrimitive } from "../cache.mjs";
import { mapSequence, sequenceEffect } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   node: estree.VariableDeclarator,
 * ) => node is estree.VariableDeclarator & {
 *   init: estree.Expression
 * }}
 */
export const hasInitDeclarator = (node) => node.init != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.VariableDeclarator>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildDeclarator = ({ node, path, meta }, scope, {}) => {
  if (node.id.type === "Identifier" && node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeSaveEffect({ path, meta }, scope, {
      type: "initialize",
      mode: getMode(scope),
      variable: /** @type {estree.Variable} */ (node.id.name),
      right: null,
    });
  } else {
    return sequenceEffect(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          hasInitDeclarator(node)
            ? unbuildNameExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "init",
                ),
                scope,
                {
                  name: cachePrimitive(
                    node.id.type === "Identifier" ? node.id.name : "",
                  ),
                },
              )
            : makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        (right) =>
          unbuildInitializePatternEffect(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "id"),
            scope,
            { right },
          ),
      ),
      path,
    );
  }
};
