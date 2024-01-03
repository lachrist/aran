import { drillSite, drillDeepSite } from "../site.mjs";
import { flatMapIndex, map } from "../../util/index.mjs";
import { makeReadCacheExpression, listWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  mapSequence,
  sequenceControlBlock,
  zeroSequence,
} from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { extendScope, setupRegularFrame } from "../scope/index.mjs";

/**
 * @type {(
 *   node: estree.SwitchCase,
 * ) => node is estree.SwitchCase & {
 *   test: estree.Expression,
 * }}
 */
const hasCaseTest = (node) => node.test != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.SwitchCase>,
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
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildCase = (
  { node, path, meta },
  scope,
  { last, discriminant, matched, completion, loop },
) => {
  if (hasCaseTest(node)) {
    return [
      makeIfStatement(
        makeConditionalExpression(
          makeReadCacheExpression(matched, path),
          makePrimitiveExpression(true, path),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(discriminant, path),
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "test",
                ),
                scope,
                null,
              ),
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
          mapSequence(
            mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
              extendScope(
                extendScope(scope, { type: "block", kind: "else" }),
                frame,
              ),
            ),
            (scope) => ({
              body: flatMapIndex(node.consequent.length, (index) =>
                unbuildStatement(
                  drillDeepSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "consequent",
                    index,
                  ),
                  scope,
                  { labels: [], completion, loop },
                ),
              ),
            }),
          ),
          [],
          path,
        ),
        sequenceControlBlock(zeroSequence({ body: [] }), [], path),
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
        ...flatMapIndex(node.consequent.length, (index) =>
          unbuildStatement(
            drillDeepSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "consequent",
              index,
            ),
            scope,
            { labels: [], completion, loop },
          ),
        ),
      ];
    } else {
      return [
        makeIfStatement(
          makeReadCacheExpression(matched, path),
          sequenceControlBlock(
            mapSequence(
              mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
                extendScope(
                  extendScope(scope, { type: "block", kind: "then" }),
                  frame,
                ),
              ),
              (scope) => ({
                body: flatMapIndex(node.consequent.length, (index) =>
                  unbuildStatement(
                    drillDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "consequent",
                      index,
                    ),
                    scope,
                    {
                      labels: [],
                      completion,
                      loop,
                    },
                  ),
                ),
              }),
            ),
            [],
            path,
          ),
          sequenceControlBlock(zeroSequence({ body: [] }), [], path),
          path,
        ),
      ];
    }
  }
};
