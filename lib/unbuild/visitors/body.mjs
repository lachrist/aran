import { hasDirectEvalCall, listBinding } from "../query/index.mjs";
import {
  extendScope,
  getMode,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { concat_, EMPTY, some } from "../../util/index.mjs";
import {
  callSequence_X_,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
} from "../../sequence.mjs";
import { makeBlockStatement, makeControlBlock } from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../incorporate.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     simple: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { simple, hoisting },
) => {
  const dynamic =
    !simple &&
    getMode(scope) === "sloppy" &&
    some(node.body, hasDirectEvalCall);
  const bindings = listBinding(hoisting, path);
  if (!dynamic && bindings.length === 0) {
    return unbuildBody(
      drillSiteArray(drillSite(node, path, meta, "body")),
      scope,
      {
        hoisting,
        labels: [],
        completion: VOID_COMPLETION,
        loop: {
          break: null,
          continue: null,
        },
      },
    );
  } else {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeBlockStatement,
        incorporateControlBlock(
          liftSequence__X_(
            makeControlBlock,
            EMPTY,
            EMPTY,
            incorporateStatement(
              callSequence_X_(
                unbuildBody,
                drillSiteArray(drillSite(node, path, meta, "body")),
                liftSequence_X(
                  extendScope,
                  scope,
                  dynamic
                    ? setupEvalFrame(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        bindings,
                      )
                    : setupRegularFrame(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        bindings,
                      ),
                ),
                {
                  hoisting,
                  labels: [],
                  completion: VOID_COMPLETION,
                  loop: {
                    break: null,
                    continue: null,
                  },
                },
              ),
              path,
            ),
            path,
          ),
          path,
        ),
        path,
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Statement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: import("../atom").Label[],
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     completion: import("../completion").StatementCompletion
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildControlBody = (
  { node, path, meta },
  scope,
  { labels, hoisting, completion, loop },
) =>
  incorporateControlBlock(
    liftSequence__X_(
      makeControlBlock,
      labels,
      EMPTY,
      incorporateStatement(
        callSequence_X_(
          unbuildBody,
          node.type === "BlockStatement"
            ? drillSiteArray(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "body",
                ),
              )
            : [{ node, path, meta: forkMeta((meta = nextMeta(meta))) }],
          liftSequence_X(
            extendScope,
            scope,
            //
            // Why not:
            //
            // setupRegularFrame(
            //   { path },
            //   listBinding(
            //     node.type === "BlockStatement"
            //       ? listBinding(hoisting, path)
            //       : [],
            //   ),
            // )
            //
            // Because in sloppy mode is function declarations
            // introduce a frame in IfStatement:
            //
            // (((f) => {
            //   console.log({ f }); // { f: 123 }
            //   if (true)
            //     function f () {}
            //   console.log({ f }); // { f : 123 }
            // }) (123));
            //
            setupRegularFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              listBinding(hoisting, path),
            ),
          ),
          {
            hoisting,
            labels: [],
            completion,
            loop,
          },
        ),
        path,
      ),
      path,
    ),
    path,
  );
