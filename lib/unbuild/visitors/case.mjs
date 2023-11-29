import { drill, drillArray } from "../site.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeReadCacheExpression, listWriteCacheEffect } from "../cache.mjs";
import {
  makeBinaryExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
} from "../node.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.SwitchCase>,
 *   context: import("../context.js").Context,
 *   options: {
 *     discriminant: import("../cache.mjs").ConstantCache,
 *     matched: import("../cache.mjs").WritableCache,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *     completion: import("./statement.mjs").Completion,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildCase = (
  { node, path, meta },
  context,
  { discriminant, matched, completion, loop },
) => {
  const sites = drill({ node, path, meta }, ["test", "consequent"]);
  if (isNotNullishSite(sites.test)) {
    return [
      makeIfStatement(
        makeConditionalExpression(
          makeReadCacheExpression(matched, path),
          makePrimitiveExpression(true, path),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(discriminant, path),
              unbuildExpression(sites.test, context, {}),
              path,
            ),
            makeLongSequenceExpression(
              listWriteCacheEffect(
                matched,
                makePrimitiveExpression(true, path),
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            makePrimitiveExpression(false, path),
            path,
          ),
          path,
        ),
        makeScopeControlBlock(
          context,
          { link: null, kinds: {} },
          [],
          (context) =>
            flatMap(drillArray(sites.consequent), (site) =>
              unbuildStatement(site, context, {
                labels: [],
                completion,
                loop,
              }),
            ),
          path,
        ),
        makeScopeControlBlock(
          context,
          { link: null, kinds: {} },
          [],
          (_context) => [],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [
      ...map(
        listWriteCacheEffect(
          matched,
          makePrimitiveExpression(true, path),
          path,
        ),
        (node) => makeEffectStatement(node, path),
      ),
      ...flatMap(drillArray(sites.consequent), (site) =>
        unbuildStatement(site, context, {
          labels: [],
          completion,
          loop,
        }),
      ),
    ];
  }
};
