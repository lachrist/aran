import { EMPTY, concat_, concat_X, flat, map } from "../../util/index.mjs";
import { makeReadCacheExpression, makeWriteCacheEffect } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeSegmentBlock,
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
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { extendRegularVariable } from "../scope/index.mjs";
import {
  incorporateStatement,
  incorporateSegmentBlock,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").SwitchCase<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").SwitchCase<import("../../hash").HashProp> & {
 *   test: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasCaseTest = (node) => node.test != null;

/**
 * @type {(
 *   node: import("estree-sentry").SwitchCase<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     last: boolean,
 *     discriminant: import("../cache").ConstantCache,
 *     matched: import("../cache").WritableCache,
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildCase = (
  node,
  meta,
  scope,
  { last, discriminant, matched, loop },
) => {
  const { _hash: hash } = node;
  if (hasCaseTest(node)) {
    return liftSequenceX(
      concat_,
      liftSequenceXX__(
        makeIfStatement,
        liftSequence__X_(
          makeConditionalExpression,
          makeReadCacheExpression(matched, hash),
          makePrimitiveExpression(true, hash),
          liftSequenceX___(
            makeConditionalExpression,
            liftSequence__X_(
              makeBinaryExpression,
              "===",
              makeReadCacheExpression(discriminant, hash),
              unbuildExpression(
                node.test,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              hash,
            ),
            makeSequenceExpression(
              [
                makeWriteCacheEffect(
                  matched,
                  makePrimitiveExpression(true, hash),
                  hash,
                ),
              ],
              makePrimitiveExpression(true, hash),
              hash,
            ),
            makePrimitiveExpression(false, hash),
            hash,
          ),
          hash,
        ),
        incorporateSegmentBlock(
          liftSequence__X_(
            makeSegmentBlock,
            EMPTY,
            EMPTY,
            incorporateStatement(
              bindSequence(
                // empty scope to detect distant initialization
                extendRegularVariable(
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  { bindings: EMPTY, links: EMPTY },
                  scope,
                ),
                (scope) =>
                  liftSequenceX(
                    flat,
                    flatSequence(
                      map(node.consequent, (node) =>
                        unbuildStatement(
                          node,
                          forkMeta((meta = nextMeta(meta))),
                          scope,
                          { labels: [], loop },
                        ),
                      ),
                    ),
                  ),
              ),
              hash,
            ),
            hash,
          ),
          hash,
        ),
        makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash),
        hash,
      ),
    );
  } else {
    if (last) {
      return liftSequence_X(
        concat_X,
        makeEffectStatement(
          makeWriteCacheEffect(
            matched,
            makePrimitiveExpression(true, hash),
            hash,
          ),
          hash,
        ),
        liftSequenceX(
          flat,
          flatSequence(
            map(node.consequent, (node) =>
              unbuildStatement(node, forkMeta((meta = nextMeta(meta))), scope, {
                labels: [],
                loop,
              }),
            ),
          ),
        ),
      );
    } else {
      return liftSequenceX(
        concat_,
        liftSequence_X__(
          makeIfStatement,
          makeReadCacheExpression(matched, hash),
          incorporateSegmentBlock(
            liftSequence__X_(
              makeSegmentBlock,
              EMPTY,
              EMPTY,
              incorporateStatement(
                bindSequence(
                  // empty scope to detect distant initialization
                  extendRegularVariable(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    { bindings: EMPTY, links: EMPTY },
                    scope,
                  ),
                  (scope) =>
                    liftSequenceX(
                      flat,
                      flatSequence(
                        map(node.consequent, (node) =>
                          unbuildStatement(
                            node,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            { labels: [], loop },
                          ),
                        ),
                      ),
                    ),
                ),
                hash,
              ),
              hash,
            ),
            hash,
          ),
          makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash),
          hash,
        ),
      );
    }
  }
};
