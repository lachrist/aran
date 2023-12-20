import { drill, drillArray } from "../site.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeReadCacheExpression, listWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { extendStaticScope } from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  bindSequence,
  dropSequence,
  sequenceControlBlock,
  tellSequence,
} from "../sequence.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.SwitchCase>,
 *   scope:import("../scope").Scope,
 *   options: {
 *     last: boolean,
 *     discriminant: import("../cache.d.ts").ConstantCache,
 *     matched: import("../cache.d.ts").WritableCache,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *     completion: import("./statement.d.ts").Completion,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildCase = (
  { node, path, meta },
  context,
  { last, discriminant, matched, completion, loop },
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
        sequenceControlBlock(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
            (context) =>
              tellSequence(
                flatMap(drillArray(sites.consequent), (site) =>
                  unbuildStatement(site, context, {
                    labels: [],
                    completion,
                    loop,
                  }),
                ),
              ),
          ),
          [],
          path,
        ),
        sequenceControlBlock(
          dropSequence(
            extendStaticScope({ path }, context, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
          ),
          [],
          path,
        ),
        path,
      ),
    ];
  } else {
    if (last) {
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
    } else {
      return [
        makeIfStatement(
          makeReadCacheExpression(matched, path),
          sequenceControlBlock(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "local", link: null, kinds: {} },
              }),
              (context) =>
                tellSequence(
                  flatMap(drillArray(sites.consequent), (site) =>
                    unbuildStatement(site, context, {
                      labels: [],
                      completion,
                      loop,
                    }),
                  ),
                ),
            ),
            [],
            path,
          ),
          sequenceControlBlock(
            dropSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "local", link: null, kinds: {} },
              }),
            ),
            [],
            path,
          ),
          path,
        ),
      ];
    }
  }
};
