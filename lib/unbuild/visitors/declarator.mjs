import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { listScopeSaveEffect } from "../scope/index.mjs";
import { callSequence____X, zeroSequence } from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   kind: "var" | "let" | "const",
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildDeclarator = (node, meta, context, kind) => {
  const { _hash: hash } = node;
  if (node.id.type === "Identifier" && node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return listScopeSaveEffect(hash, meta, context.scope, {
      type: "initialize",
      mode: context.mode,
      variable: node.id.name,
      right: null,
    });
  } else {
    return callSequence____X(
      unbuildPattern,
      node.id,
      forkMeta((meta = nextMeta(meta))),
      context,
      kind,
      node.init != null
        ? unbuildNameExpression(
            node.init,
            forkMeta((meta = nextMeta(meta))),
            context,
            node.id.type === "Identifier"
              ? { type: "assignment", variable: node.id.name }
              : ANONYMOUS_NAME,
          )
        : zeroSequence(makeIntrinsicExpression("undefined", hash)),
    );
  }
};
