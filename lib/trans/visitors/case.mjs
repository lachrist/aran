import {
  EMPTY,
  concat_,
  concat__,
  flatenTree,
  map,
  tuple2,
  flatSequence,
  liftSequenceX,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
} from "../../util/index.mjs";
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
import { transExpression } from "./expression.mjs";
import { transBodyStatement } from "./statement.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { incorporateSegmentBlock } from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").SwitchCase<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").SwitchCase<import("../hash.d.ts").HashProp> & {
 *   test: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 * }}
 */
const hasCaseTest = (node) => node.test != null;

/**
 * @type {(
 *   node: import("estree-sentry").SwitchCase<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     last: boolean,
 *     discriminant: import("../cache.d.ts").ConstantCache,
 *     matched: import("../cache.d.ts").WritableCache,
 *     loop: {
 *       break: null | import("../atom.d.ts").Label,
 *       continue: null | import("../atom.d.ts").Label,
 *     },
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   [
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
 *     import("../scope/index.d.ts").Scope,
 *   ],
 * >}
 */
export const transCase = (
  node,
  meta,
  scope,
  { last, discriminant, matched, loop },
) => {
  const { _hash: hash } = node;
  /**
   * @type {<X>(
   *   pair: [X, import("../scope/index.d.ts").Scope],
   * ) => X}
   */
  const updateScope = (pair) => {
    // eslint-disable-next-line local/no-impure
    scope = pair[1];
    return pair[0];
  };
  if (hasCaseTest(node)) {
    return liftSequenceX_(
      tuple2,
      liftSequenceX(
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
                transExpression(
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
              liftSequenceX(
                flatenTree,
                flatSequence(
                  map(node.consequent, (node) =>
                    mapSequence(
                      transBodyStatement(
                        node,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { labels: [], loop },
                      ),
                      updateScope,
                    ),
                  ),
                ),
              ),
              hash,
            ),
            hash,
          ),
          makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash),
          hash,
        ),
      ),
      scope,
    );
  } else {
    if (last) {
      return liftSequenceX_(
        tuple2,
        liftSequence_X(
          concat__,
          makeEffectStatement(
            makeWriteCacheEffect(
              matched,
              makePrimitiveExpression(true, hash),
              hash,
            ),
            hash,
          ),
          flatSequence(
            map(node.consequent, (node) =>
              mapSequence(
                transBodyStatement(
                  node,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  {
                    labels: [],
                    loop,
                  },
                ),
                updateScope,
              ),
            ),
          ),
        ),
        scope,
      );
    } else {
      return liftSequenceX_(
        tuple2,
        liftSequence_X__(
          makeIfStatement,
          makeReadCacheExpression(matched, hash),
          incorporateSegmentBlock(
            liftSequence__X_(
              makeSegmentBlock,
              EMPTY,
              EMPTY,
              liftSequenceX(
                flatenTree,
                flatSequence(
                  map(node.consequent, (node) =>
                    mapSequence(
                      transBodyStatement(
                        node,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { labels: [], loop },
                      ),
                      updateScope,
                    ),
                  ),
                ),
              ),
              hash,
            ),
            hash,
          ),
          makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash),
          hash,
        ),
        scope,
      );
    }
  }
};
