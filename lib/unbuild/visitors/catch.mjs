import { concatX_, EMPTY } from "../../util/index.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeSegmentBlock,
} from "../node.mjs";
import { unbuildSegmentBody } from "./body.mjs";
import { unbuildPattern } from "./pattern.mjs";
import {
  bindSequence,
  callSequence___X,
  callSequence____X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence__X_,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateSegmentBlock,
} from "../prelude/index.mjs";
import { hoist } from "../annotation/index.mjs";
import {
  extendCatch,
  extendRegularVariable,
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
              extendRegularVariable,
              hash,
              forkMeta((meta = nextMeta(meta))),
              { bindings: hoist(hash, scope.annotation), links: EMPTY },
              extendCatch(hash, forkMeta((meta = nextMeta(meta))), {}, scope),
            ),
            (scope) =>
              liftSequenceXX(
                concatX_,
                liftSequenceX_(
                  listEffectStatement,
                  callSequence____X(
                    unbuildPattern,
                    ts_node_param,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    "let",
                    makeReadErrorExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      {},
                    ),
                  ),
                  hash,
                ),
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
