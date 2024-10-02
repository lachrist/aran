import { concatX_ } from "../../util/index.mjs";
import {
  CATCH_FRAME,
  extendScope,
  getMode,
  makeScopeLoadExpression,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeControlBlock,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import {
  bindSequence,
  callSequence__X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { hoist } from "../annotation/index.mjs";

/**
 * @type {(
 *   node : import("estree-sentry").CatchClause<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     labels: import("../atom").Label[],
 *     origin: "program" | "closure",
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
export const unbuildCatch = (
  node,
  meta,
  { scope, annotation, labels, origin, loop },
) => {
  const { _hash: hash } = node;
  const mode = getMode(scope);
  if (node.param != null) {
    const ts_node_param = node.param;
    return incorporateControlBlock(
      liftSequence__X_(
        makeControlBlock,
        labels,
        [],
        incorporateStatement(
          bindSequence(
            mapSequence(
              setupRegularFrame(
                hash,
                forkMeta((meta = nextMeta(meta))),
                hoist(hash, annotation),
              ),
              (frame) => extendScope(extendScope(scope, CATCH_FRAME), frame),
            ),
            (scope) =>
              liftSequenceXX(
                concatX_,
                liftSequenceX_(
                  listEffectStatement,
                  callSequence__X(
                    unbuildPattern,
                    ts_node_param,
                    forkMeta((meta = nextMeta(meta))),
                    liftSequenceX_(
                      makePatternContext,
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { type: "read-error", mode },
                      ),
                      { kind: "let", scope, annotation },
                    ),
                  ),
                  hash,
                ),
                liftSequenceX_(
                  makeBlockStatement,
                  unbuildControlBody(
                    node.body,
                    forkMeta((meta = nextMeta(meta))),
                    { scope, annotation, labels, loop, origin },
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
    return unbuildControlBody(node.body, forkMeta((meta = nextMeta(meta))), {
      scope: extendScope(scope, CATCH_FRAME),
      annotation,
      labels,
      origin,
      loop,
    });
  }
};
