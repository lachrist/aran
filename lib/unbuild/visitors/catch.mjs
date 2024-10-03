import { concatX_ } from "../../util/index.mjs";
import {
  CATCH_FRAME,
  extendScope,
  makeScopeLoadExpression,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeControlBlock,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPattern } from "./pattern.mjs";
import {
  bindSequence,
  callSequence____X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { hoist } from "../annotation/index.mjs";
import { updateContextScope } from "../context.mjs";

/**
 * @type {(
 *   node : import("estree-sentry").CatchClause<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   labeling: {
 *     labels: import("../atom").Label[],
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildCatch = (node, meta, context, { labels, loop }) => {
  const { _hash: hash } = node;
  const mode = context.mode;
  if (node.param != null) {
    const ts_node_param = node.param;
    return incorporateControlBlock(
      liftSequence__X_(
        makeControlBlock,
        labels,
        [],
        incorporateStatement(
          bindSequence(
            liftSequence_X(
              updateContextScope,
              context,
              liftSequence_X(
                extendScope,
                extendScope(context.scope, CATCH_FRAME),
                setupRegularFrame(
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  hoist(hash, context.annotation),
                ),
              ),
            ),
            (context) =>
              liftSequenceXX(
                concatX_,
                liftSequenceX_(
                  listEffectStatement,
                  callSequence____X(
                    unbuildPattern,
                    ts_node_param,
                    forkMeta((meta = nextMeta(meta))),
                    context,
                    "let",
                    makeScopeLoadExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      context.scope,
                      { type: "read-error", mode },
                    ),
                  ),
                  hash,
                ),
                liftSequenceX_(
                  makeBlockStatement,
                  unbuildControlBody(
                    node.body,
                    forkMeta((meta = nextMeta(meta))),
                    context,
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
    return unbuildControlBody(
      node.body,
      forkMeta((meta = nextMeta(meta))),
      { ...context, scope: extendScope(context.scope, CATCH_FRAME) },
      { labels, loop },
    );
  }
};
