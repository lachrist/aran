import {
  hasDirectEvalCall,
  hasReturnStatement,
  listBinding,
} from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupEvalFrame,
  setupRegularFrame,
  shouldUpdateCompletion,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { concatXX, concatXXX, EMPTY, some } from "../../util/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
} from "../../sequence.mjs";
import {
  listEffectStatement,
  makeControlBlock,
  makeIntrinsicExpression,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { RETURN_BREAK_LABEL } from "../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const listResetCompletionStatement = ({ path, meta }, scope) =>
  shouldUpdateCompletion(scope, path)
    ? liftSequenceX_(
        listEffectStatement,
        listScopeSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          {
            type: "update-result",
            mode: getMode(scope),
            result: null,
          },
        ),
        path,
      )
    : EMPTY_SEQUENCE;

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
    bindSequence(
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
      (scope) =>
        liftSequence__X_(
          makeControlBlock,
          labels,
          EMPTY,
          liftSequenceXX(
            concatXX,
            listResetCompletionStatement(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
            ),
            unbuildBody(
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
              scope,
              {
                origin,
                hoisting,
                labels: [],
                loop,
              },
            ),
          ),
          path,
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").BlockStatement>,
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
export const unbuildFinallyBody = (
  { node, path, meta },
  scope,
  { origin, labels, hoisting, loop },
) =>
  shouldUpdateCompletion(scope, path)
    ? incorporateControlBlock(
        bindSequence(
          liftSequence_X(
            extendScope,
            scope,
            setupRegularFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              listBinding(hoisting, path),
            ),
          ),
          (scope) =>
            liftSequence__X_(
              makeControlBlock,
              labels,
              EMPTY,
              bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeScopeLoadExpression(
                    {
                      path,
                      meta: forkMeta((meta = nextMeta(meta))),
                    },
                    scope,
                    {
                      type: "backup-result",
                      mode: getMode(scope),
                    },
                  ),
                  path,
                ),
                (backup) =>
                  liftSequenceXXX(
                    concatXXX,
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        {
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        },
                        scope,
                        {
                          type: "update-result",
                          mode: getMode(scope),
                          result: makeIntrinsicExpression("undefined", path),
                        },
                      ),
                      path,
                    ),
                    unbuildBody(
                      drillSiteArray(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "body",
                        ),
                      ),
                      scope,
                      {
                        origin,
                        hoisting,
                        labels: [],
                        loop,
                      },
                    ),
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        {
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        },
                        scope,
                        {
                          type: "update-result",
                          mode: getMode(scope),
                          result: makeReadCacheExpression(backup, path),
                        },
                      ),
                      path,
                    ),
                  ),
              ),
              path,
            ),
        ),
        path,
      )
    : incorporateControlBlock(
        bindSequence(
          liftSequence_X(
            extendScope,
            scope,
            setupRegularFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              listBinding(hoisting, path),
            ),
          ),
          (scope) =>
            liftSequence__X_(
              makeControlBlock,
              labels,
              EMPTY,
              unbuildBody(
                drillSiteArray(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "body",
                  ),
                ),
                scope,
                {
                  origin,
                  hoisting,
                  labels: [],
                  loop,
                },
              ),
              path,
            ),
        ),
        path,
      );
