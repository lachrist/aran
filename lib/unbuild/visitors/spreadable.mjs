import { drill } from "../site.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.SpreadElement,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildSpreadable = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "SpreadElement": {
      const metas = splitMeta(meta, ["drill", "iterator"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return makeInitCacheExpression(
        "constant",
        unbuildExpression(sites.argument, context, {}),
        { path, meta: metas.iterator },
        (iterator) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeUnaryExpression(
                "typeof",
                makeGetExpression(
                  makeReadCacheExpression(iterator, path),
                  makeIntrinsicExpression("Symbol.iterator", path),
                  path,
                ),
                path,
              ),
              makePrimitiveExpression("function", path),
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Array.from", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadCacheExpression(iterator, path)],
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              "Spread syntax requires iterable object",
              path,
            ),
            path,
          ),
      );
    }
    default: {
      return makeArrayExpression(
        [unbuildExpression({ node, path, meta }, context, {})],
        path,
      );
    }
  }
};
