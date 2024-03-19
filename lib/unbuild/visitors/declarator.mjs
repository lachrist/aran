import { drillSite } from "../site.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { cacheConstant } from "../cache.mjs";
import { bindSequence, callSequence_X_, zeroSequence } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { cleanupEffect } from "../cleanup.mjs";

/**
 * @type {(
 *   node: estree.VariableDeclarator,
 * ) => node is estree.VariableDeclarator & {
 *   init: estree.Expression
 * }}
 */
const hasInitDeclarator = (node) => node.init != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.VariableDeclarator>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const",
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const unbuildDeclarator = ({ node, path, meta }, scope, { kind }) => {
  if (node.id.type === "Identifier" && node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeSaveEffect({ path, meta }, scope, {
      type: "initialize",
      kind,
      mode: getMode(scope),
      variable: /** @type {estree.Variable} */ (node.id.name),
      right: null,
      manufactured: false,
    });
  } else {
    return cleanupEffect(
      bindSequence(
        callSequence_X_(
          cacheConstant,
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
                  name:
                    node.id.type === "Identifier"
                      ? {
                          type: "assignment",
                          variable: /** @type {estree.Variable} */ (
                            node.id.name
                          ),
                        }
                      : {
                          type: "anonymous",
                        },
                },
              )
            : zeroSequence(makePrimitiveExpression({ undefined: null }, path)),
          path,
        ),
        (right) =>
          unbuildPattern(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "id"),
            scope,
            { kind, right },
          ),
      ),
      path,
    );
  }
};
