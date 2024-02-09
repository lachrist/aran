import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { mapSequence, zeroSequence } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_OBJECT } from "../object.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").CachePrelude,
 *   import("../object").Object
 * >}
 */
export const unbuildObject = ({ node, path, meta }, scope, _options) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return zeroSequence({
      type: "regular",
      data: unbuildExpression(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        null,
      ),
    });
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
 *   import("../object").Object
 * )>}
 */
export const unbuildChainObject = ({ node, path, meta }, scope, _options) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return mapSequence(
      unbuildChainElement(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        null,
      ),
      (object) => ({
        type: "regular",
        data: zeroSequence(object),
      }),
    );
  }
};
