import { drillSite } from "../site.mjs";
import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import {
  callSequence__X,
  liftSequence_X,
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
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildDeclarator = ({ node, path, meta }, scope, { kind }) => {
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
    return callSequence__X(
      unbuildPattern,
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), "id"),
      scope,
      liftSequence_X(
        makePatternContext,
        kind,
        hasInitDeclarator(node)
          ? unbuildNameExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "init"),
              scope,
              {
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
