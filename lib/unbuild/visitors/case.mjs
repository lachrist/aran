import { EMPTY, concat_, concat_X, flat, map } from "../../util/index.mjs";
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
 *   node: import("../../estree").SwitchCase,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     origin: "program" | "closure",
 *     last: boolean,
 *     discriminant: import("../cache.d.ts").ConstantCache,
 *     matched: import("../cache.d.ts").WritableCache,
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
  { digest, scope, annotation, last, discriminant, matched, origin, loop },
) => {
  const hash = digest(node);
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
              unbuildExpression(node.test, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
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
        incorporateControlBlock(
          liftSequence__X_(
            makeControlBlock,
            EMPTY,
            EMPTY,
            incorporateStatement(
              bindSequence(
                mapSequence(
                  setupRegularFrame(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    EMPTY,
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  liftSequenceX(
                    flat,
                    flatSequence(
                      map(node.consequent, (node) =>
                        unbuildStatement(
                          node,
                          forkMeta((meta = nextMeta(meta))),
                          {
                            digest,
                            scope,
                            annotation,
                            labels: [],
                            origin,
                            loop,
                          },
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
        makeControlBlock(EMPTY, EMPTY, EMPTY, hash),
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
              unbuildStatement(node, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
                labels: [],
                origin,
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
          incorporateControlBlock(
            liftSequence__X_(
              makeControlBlock,
              EMPTY,
              EMPTY,
              incorporateStatement(
                bindSequence(
                  liftSequence_X(
                    extendScope,
                    scope,
                    setupRegularFrame(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      EMPTY,
                    ),
                  ),
                  (scope) =>
                    liftSequenceX(
                      flat,
                      flatSequence(
                        map(node.consequent, (node) =>
                          unbuildStatement(
                            node,
                            forkMeta((meta = nextMeta(meta))),
                            {
                              digest,
                              scope,
                              annotation,
                              labels: [],
                              origin,
                              loop,
                            },
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
          makeControlBlock(EMPTY, EMPTY, EMPTY, hash),
          hash,
        ),
      );
    }
  }
};
