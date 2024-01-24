import { cacheConstant } from "../cache.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { bindSequence, mapSequence, zeroSequence } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_TARGET, makeRegularTarget } from "../target.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     nullish_check: "eager" | "lazy",
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   import("../target").Target
 * >}
 */
export const unbuildTarget = (
  { node, path, meta },
  scope,
  { nullish_check },
) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_TARGET);
  } else {
    return bindSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        unbuildExpression(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          null,
        ),
        path,
      ),
      (cache) => makeRegularTarget({ path }, cache, nullish_check),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").ChainSequence<(
 *   import("../target").Target
 * )>}
 */
export const unbuildChainTarget = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence(SUPER_TARGET);
    }
    default: {
      return bindSequence(
        unbuildChainElement(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          null,
        ),
        (target) =>
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              zeroSequence(object),
              path,
            ),
            (object) => ({ type: "regular", data: object }),
          ),
      );
    }
  }
};
