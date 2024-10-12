import { concatX_, map } from "../../util/index.mjs";
import {
  makeBlockStatement,
  makeEffectStatement,
  makeSegmentBlock,
} from "../node.mjs";
import { unbuildSegmentBody } from "./body.mjs";
import { unbuildInitializePattern } from "./pattern.mjs";
import {
  bindSequence,
  callSequence___X,
  liftSequenceX_,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateSegmentBlock,
} from "../prelude/index.mjs";
import { hoist } from "../annotation/index.mjs";
import {
  extendCatch,
  extendNormalRegularVariable,
  makeReadErrorExpression,
} from "../scope/index.mjs";

/**
 * @type {(
 *   node : import("estree-sentry").CatchClause<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   labeling: {
 *     labels: import("../atom").Label[],
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildCatch = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  if (node.param != null) {
    const ts_node_param = node.param;
    return incorporateSegmentBlock(
      liftSequence__X_(
        makeSegmentBlock,
        labels,
        [],
        incorporateStatement(
          bindSequence(
            callSequence___X(
              extendNormalRegularVariable,
              hash,
              forkMeta((meta = nextMeta(meta))),
              { bindings: hoist(hash, scope.annotation) },
              extendCatch(hash, forkMeta((meta = nextMeta(meta))), {}, scope),
            ),
            (scope) =>
              bindSequence(
                callSequence___X(
                  unbuildInitializePattern,
                  ts_node_param,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  makeReadErrorExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    {},
                  ),
                ),
                ({ 0: part1, 1: scope }) =>
                  mapSequence(
                    liftSequenceX_(
                      makeBlockStatement,
                      unbuildSegmentBody(
                        node.body,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { labels, loop },
                      ),
                      hash,
                    ),
                    (part2) =>
                      concatX_(
                        map(part1, (part) => makeEffectStatement(part, hash)),
                        part2,
                      ),
                  ),
              ),
          ),
          hash,
        ),
        hash,
      ),
      hash,
    );
  } else {
    return unbuildSegmentBody(
      node.body,
      forkMeta((meta = nextMeta(meta))),
      scope,
      { labels, loop },
    );
  }
};
