import {
  hasDirectEvalCall,
  hasReturnStatement,
  listBinding,
} from "../query/index.mjs";
import {
  extendScope,
  getMode,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { EMPTY, some } from "../../util/index.mjs";
import {
  callSequence_X_,
  liftSequence_X,
  liftSequence__X_,
} from "../../sequence.mjs";
import { makeControlBlock } from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { RETURN_BREAK_LABEL } from "../mangle.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     simple: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { simple, hoisting },
) =>
  incorporateControlBlock(
    liftSequence__X_(
      makeControlBlock,
      hasReturnStatement(node) ? [RETURN_BREAK_LABEL] : EMPTY,
      EMPTY,
      incorporateStatement(
        callSequence_X_(
          unbuildBody,
          drillSiteArray(drillSite(node, path, meta, "body")),
          liftSequence_X(
            extendScope,
            scope,
            !simple &&
              getMode(scope) === "sloppy" &&
              some(node.body, hasDirectEvalCall)
              ? setupEvalFrame(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, path),
                )
              : setupRegularFrame(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, path),
                ),
          ),
          {
            hoisting,
            labels: [],
            origin: "closure",
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
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Statement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     origin: "closure" | "program",
 *     labels: import("../atom").Label[],
 *     hoisting: import("../query/hoist-public").Hoisting,
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
  { origin, labels, hoisting, loop },
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
            origin,
            hoisting,
            labels: [],
            loop,
          },
        ),
        path,
      ),
      path,
    ),
    path,
  );
