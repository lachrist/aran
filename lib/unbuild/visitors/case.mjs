import { drill, drillArray } from "../site.mjs";
import { flatMap } from "../../util/index.mjs";
import { makeReadCacheExpression, makeWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { makeScopeControlBlock } from "../scope/block.mjs";
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
            makeSequenceExpression(
              makeWriteCacheEffect(
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
          {
            type: "block",
            this: null,
            catch: false,
            kinds: {},
          },
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
          {
            type: "block",
            this: null,
            catch: false,
            kinds: {},
          },
          [],
          (_context) => [],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [
      makeEffectStatement(
        makeWriteCacheEffect(
          matched,
          makePrimitiveExpression(true, path),
          path,
        ),
        path,
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
