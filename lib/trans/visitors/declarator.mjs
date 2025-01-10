import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import {
  callSequence___X,
  NULL_SEQUENCE,
  zeroSequence,
} from "../../util/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";
import { unbuildWritePattern, unbuildInitializePattern } from "./pattern.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildInitializeDeclarator = (node, meta, scope) => {
  const { _hash: hash } = node;
  return callSequence___X(
    unbuildInitializePattern,
    node.id,
    forkMeta((meta = nextMeta(meta))),
    scope,
    node.init != null
      ? unbuildNameExpression(
          node.init,
          forkMeta((meta = nextMeta(meta))),
          scope,
          node.id.type === "Identifier"
            ? { type: "assignment", variable: node.id.name }
            : ANONYMOUS_NAME,
        )
      : zeroSequence(makeIntrinsicExpression("undefined", hash)),
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
export const unbuildWriteDeclarator = (node, meta, scope) => {
  if (node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return NULL_SEQUENCE;
  } else {
    return callSequence___X(
      unbuildWritePattern,
      node.id,
      forkMeta((meta = nextMeta(meta))),
      scope,
      unbuildNameExpression(
        node.init,
        forkMeta((meta = nextMeta(meta))),
        scope,
        node.id.type === "Identifier"
          ? { type: "assignment", variable: node.id.name }
          : ANONYMOUS_NAME,
      ),
    );
  }
};
