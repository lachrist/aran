import { drillSite } from "../site.mjs";
import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import {
  callSequence_X,
  liftSequence___X,
  zeroSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 * ) => node is import("../../estree").VariableDeclarator & {
 *   init: import("../../estree").Expression
 * }}
 */
const hasInitDeclarator = (node) => node.init != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").VariableDeclarator>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildDeclarator = (
  { node, path, meta },
  { scope, deadzone, kind },
) => {
  if (node.id.type === "Identifier" && node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeSaveEffect({ path, meta }, scope, {
      type: "initialize",
      mode: getMode(scope),
      variable: /** @type {import("../../estree").Variable} */ (node.id.name),
      right: null,
    });
  } else {
    return callSequence_X(
      unbuildPattern,
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), "id"),
      liftSequence___X(
        makePatternContext,
        scope,
        deadzone,
        kind,
        hasInitDeclarator(node)
          ? unbuildNameExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "init"),
              {
                scope,
                deadzone,
                name:
                  node.id.type === "Identifier"
                    ? {
                        type: "assignment",
                        variable:
                          /** @type {import("../../estree").Variable} */ (
                            node.id.name
                          ),
                      }
                    : {
                        type: "anonymous",
                      },
              },
            )
          : zeroSequence(makeIntrinsicExpression("undefined", path)),
      ),
    );
  }
};
