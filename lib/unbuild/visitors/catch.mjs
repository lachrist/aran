import { listBinding } from "../query/index.mjs";
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
import { drillSite } from "../site.mjs";
import {
  bindSequence,
  callSequence__X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 * ) => node is import("../../estree").CatchClause & {
 *   param: import("../../estree").Pattern,
 * }}
 */
const hasCatchParam = (node) => node.param != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").CatchClause>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
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
  { node, path, meta },
  scope,
  { hoisting, labels, origin, loop },
) => {
  const mode = getMode(scope);
  if (hasCatchParam(node)) {
    return incorporateControlBlock(
      liftSequence__X_(
        makeControlBlock,
        labels,
        [],
        incorporateStatement(
          bindSequence(
            mapSequence(
              setupRegularFrame(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                listBinding(hoisting, path),
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
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "param",
                    ),
                    scope,
                    liftSequence_X(
                      makePatternContext,
                      "let",
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        { type: "read-error", mode },
                      ),
                    ),
                  ),
                  path,
                ),
                liftSequenceX_(
                  makeBlockStatement,
                  unbuildControlBody(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "body",
                    ),
                    scope,
                    { labels, hoisting, loop, origin },
                  ),
                  path,
                ),
              ),
          ),
          path,
        ),
        path,
      ),
      path,
    );
  } else {
    return unbuildControlBody(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
      extendScope(scope, { type: "catch" }),
      { labels, hoisting, origin, loop },
    );
  }
};
