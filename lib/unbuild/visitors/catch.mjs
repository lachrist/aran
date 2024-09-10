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
  callSequence_X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence__X_,
  liftSequence___X,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { declareDeadzone, updateDeadzonePattern } from "../deadzone.mjs";

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
 *   options: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     hoisting: import("../annotate/hoist-public").Hoisting,
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
  { scope, deadzone, hoisting, labels, origin, loop },
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
                  callSequence_X(
                    unbuildPattern,
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "param",
                    ),
                    liftSequence___X(
                      makePatternContext,
                      scope,
                      declareDeadzone(deadzone, listBinding(hoisting, path)),
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
                    {
                      scope,
                      deadzone: updateDeadzonePattern(
                        deadzone,
                        "let",
                        node.param,
                      ),
                      labels,
                      hoisting,
                      loop,
                      origin,
                    },
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
      {
        scope: extendScope(scope, { type: "catch" }),
        deadzone,
        labels,
        hoisting,
        origin,
        loop,
      },
    );
  }
};
