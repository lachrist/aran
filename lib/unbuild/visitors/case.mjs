import { drillSite, drillDeepSite } from "../site.mjs";
import { EMPTY, concat_, concat_X, flat, mapIndex } from "../../util/index.mjs";
import { makeReadCacheExpression, makeWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  bindSequence,
  flatSequence,
  liftSequenceX,
  liftSequenceXX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { extendScope, setupRegularFrame } from "../scope/index.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").SwitchCase,
 * ) => node is import("../../estree").SwitchCase & {
 *   test: import("../../estree").Expression,
 * }}
 */
const hasCaseTest = (node) => node.test != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").SwitchCase>,
 *   scope:import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     last: boolean,
 *     discriminant: import("../cache.d.ts").ConstantCache,
 *     matched: import("../cache.d.ts").WritableCache,
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *     completion: import("../completion").StatementCompletion,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildCase = (
  { node, path, meta },
  scope,
  { hoisting, last, discriminant, matched, completion, loop },
) => {
  if (hasCaseTest(node)) {
    return liftSequenceX(
      concat_,
      liftSequenceXX__(
        makeIfStatement,
        liftSequence__X_(
          makeConditionalExpression,
          makeReadCacheExpression(matched, path),
          makePrimitiveExpression(true, path),
          liftSequenceX___(
            makeConditionalExpression,
            liftSequence__X_(
              makeBinaryExpression,
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
              [
                makeWriteCacheEffect(
                  matched,
                  makePrimitiveExpression(true, path),
                  path,
                ),
              ],
              makePrimitiveExpression(true, path),
              path,
            ),
            makePrimitiveExpression(false, path),
            path,
          ),
          path,
        ),
        incorporateControlBlock(
          liftSequence__X_(
            makeControlBlock,
            EMPTY,
            EMPTY,
            incorporateStatement(
              bindSequence(
                mapSequence(
                  setupRegularFrame(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    EMPTY,
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  liftSequenceX(
                    flat,
                    flatSequence(
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
                          { hoisting, labels: [], completion, loop },
                        ),
                      ),
                    ),
                  ),
              ),
              path,
            ),
            path,
          ),
          path,
        ),
        makeControlBlock(EMPTY, EMPTY, EMPTY, path),
        path,
      ),
    );
  } else {
    if (last) {
      return liftSequence_X(
        concat_X,
        makeEffectStatement(
          makeWriteCacheEffect(
            matched,
            makePrimitiveExpression(true, path),
            path,
          ),
          path,
        ),
        liftSequenceX(
          flat,
          flatSequence(
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
                { hoisting, labels: [], completion, loop },
              ),
            ),
          ),
        ),
      );
    } else {
      return liftSequenceX(
        concat_,
        liftSequence_X__(
          makeIfStatement,
          makeReadCacheExpression(matched, path),
          incorporateControlBlock(
            liftSequence__X_(
              makeControlBlock,
              EMPTY,
              EMPTY,
              incorporateStatement(
                bindSequence(
                  mapSequence(
                    setupRegularFrame(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      EMPTY,
                    ),
                    (frame) => extendScope(scope, frame),
                  ),
                  (scope) =>
                    liftSequenceX(
                      flat,
                      flatSequence(
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
                              hoisting,
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
            path,
          ),
          makeControlBlock(EMPTY, EMPTY, EMPTY, path),
          path,
        ),
      );
    }
  }
};
