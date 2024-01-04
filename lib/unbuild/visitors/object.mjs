import { cacheConstant } from "../cache.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { bindSequence, mapSequence, zeroSequence } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").SetupSequence<(
 *   import("./object").Object
 * )>}
 */
export const unbuildObject = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({
        type: "super",
      });
    }
    default: {
      return mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          unbuildExpression(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            null,
          ),
          path,
        ),
        (object) => ({
          type: "regular",
          data: object,
        }),
      );
    }
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
 *   import("./object").Object
 * )>}
 */
export const unbuildChainObject = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({
        type: "super",
      });
    }
    default: {
      return bindSequence(
        unbuildChainElement(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          null,
        ),
        (object) =>
          mapSequence(
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
