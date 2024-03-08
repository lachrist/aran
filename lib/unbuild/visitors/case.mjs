import { drillSite, drillDeepSite } from "../site.mjs";
import { mapIndex } from "../../util/index.mjs";
import { makeReadCacheExpression, listWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  EMPTY_CONTROL_BODY,
  concatStatement,
  makeConditionalExpression,
  makeControlBlock,
  makeControlBody,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";
import { bindSequence, mapSequence } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { extendScope, setupRegularFrame } from "../scope/index.mjs";
import { unprefixControlBody } from "../prefix.mjs";

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
 *     completion: import("../completion").StatementCompletion,
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildCase = (
  { node, path, meta },
  scope,
  { last, discriminant, matched, completion, loop },
) => {
  if (hasCaseTest(node)) {
    return makeIfStatement(
      makeConditionalExpression(
        makeReadCacheExpression(matched, path),
        makePrimitiveExpression(true, path),
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(discriminant, path),
            unbuildExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
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
      makeControlBlock(
        [],
        unprefixControlBody(
          bindSequence(
            mapSequence(setupRegularFrame({ path }, []), (frame) =>
              extendScope(scope, frame),
            ),
            (scope) =>
              makeControlBody(
                concatStatement(
                  mapIndex(node.consequent.length, (index) =>
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
                ),
              ),
          ),
          path,
        ),
        path,
      ),
      makeControlBlock([], EMPTY_CONTROL_BODY, path),
      path,
    );
  } else {
    if (last) {
      return concatStatement([
        makeEffectStatement(
          listWriteCacheEffect(
            matched,
            makePrimitiveExpression(true, path),
            path,
          ),
          path,
        ),
        ...mapIndex(node.consequent.length, (index) =>
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
      ]);
    } else {
      return makeIfStatement(
        makeReadCacheExpression(matched, path),
        makeControlBlock(
          [],
          unprefixControlBody(
            bindSequence(
              mapSequence(setupRegularFrame({ path }, []), (frame) =>
                extendScope(scope, frame),
              ),
              (scope) =>
                makeControlBody(
                  concatStatement(
                    mapIndex(node.consequent.length, (index) =>
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
                  ),
                ),
            ),
            path,
          ),
          path,
        ),
        makeControlBlock([], EMPTY_CONTROL_BODY, path),
        path,
      );
    }
  }
};
