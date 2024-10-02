import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import {
  callSequence__X,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").VariableDeclarator<import("../../hash").HashProp> & {
 *   init: import("estree-sentry").Expression<import("../../hash").HashProp>
 * }}
 */
const hasInitDeclarator = (node) => node.init != null;

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildDeclarator = (node, meta, { scope, annotation, kind }) => {
  const { _hash: hash } = node;
  if (node.id.type === "Identifier" && node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeSaveEffect(hash, meta, scope, {
      type: "initialize",
      mode: getMode(scope),
      variable: node.id.name,
      right: null,
    });
  } else {
    return callSequence__X(
      unbuildPattern,
      node.id,
      forkMeta((meta = nextMeta(meta))),
      liftSequenceX_(
        makePatternContext,
        hasInitDeclarator(node)
          ? unbuildNameExpression(
              node.init,
              forkMeta((meta = nextMeta(meta))),
              {
                scope,
                annotation,
                name:
                  node.id.type === "Identifier"
                    ? {
                        type: "assignment",
                        variable: node.id.name,
                      }
                    : {
                        type: "anonymous",
                      },
              },
            )
          : zeroSequence(makeIntrinsicExpression("undefined", hash)),
        { scope, annotation, kind },
      ),
    );
  }
};
