import { makeIntrinsicExpression } from "../node.mjs";
import { transNameExpression } from "./expression.mjs";
import {
  callSequence___X,
  NULL_SEQUENCE,
  zeroSequence,
} from "../../util/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";
import { transWritePattern, transInitializePattern } from "./pattern.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").VariableDeclarator<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   [
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 *     import("../scope/index.d.ts").Scope,
 *   ],
 * >}
 */
export const transInitializeDeclarator = (node, meta, scope) => {
  const { _hash: hash } = node;
  return callSequence___X(
    transInitializePattern,
    node.id,
    forkMeta((meta = nextMeta(meta))),
    scope,
    node.init != null
      ? transNameExpression(
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
 *   node: import("estree-sentry").VariableDeclarator<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
export const transWriteDeclarator = (node, meta, scope) => {
  if (node.init == null) {
    // var x = 123; overwrite x.
    // But var x; does not.
    return NULL_SEQUENCE;
  } else {
    return callSequence___X(
      transWritePattern,
      node.id,
      forkMeta((meta = nextMeta(meta))),
      scope,
      transNameExpression(
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
