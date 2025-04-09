import {
  concat__,
  bindSequence,
  callSequence___X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence__X_,
  mapSequence,
} from "../../util/index.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeTreeSegmentBlock,
} from "../node.mjs";
import { transSegmentBody } from "./body.mjs";
import { transInitializePattern } from "./pattern.mjs";
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
 *   node : import("estree-sentry").CatchClause<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   labeling: import("../labeling.d.ts").BodyLabeling,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").SegmentBlock,
 * >}
 */
export const transCatch = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  if (node.param != null) {
    const ts_node_param = node.param;
    return incorporateSegmentBlock(
      liftSequence__X_(
        makeTreeSegmentBlock,
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
              liftSequenceXX(
                concat__,
                liftSequenceX_(
                  listEffectStatement,
                  mapSequence(
                    callSequence___X(
                      transInitializePattern,
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
                    (pair) => {
                      // eslint-disable-next-line local/no-impure
                      scope = pair[1];
                      return pair[0];
                    },
                  ),
                  hash,
                ),
                liftSequenceX_(
                  makeBlockStatement,
                  transSegmentBody(
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
    return transSegmentBody(
      node.body,
      forkMeta((meta = nextMeta(meta))),
      scope,
      { labels, loop },
    );
  }
};
