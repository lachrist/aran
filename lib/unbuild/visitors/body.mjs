import { hasDirectEvalCall, listBinding } from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import {
  EMPTY,
  concatXX,
  concat_,
  filter,
  flat,
  includes,
  map,
  some,
} from "../../util/index.mjs";
import {
  bindSequence,
  callSequence_X_,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeControlBlock,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import { incorporatePrefixStatement } from "../prefix.mjs";
import { incorporateDeclarationControlBlock } from "../declaration.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     parameters: import("../../estree").Variable[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { hoisting, parameters },
) => {
  const mode = getMode(scope);
  const dynamic = mode === "sloppy" && some(node.body, hasDirectEvalCall);
  const bindings = listBinding(hoisting, path);
  if (bindings.length === 0) {
    return incorporatePrefixStatement(
      callSequence_X_(
        unbuildBody,
        drillSiteArray(drillSite(node, path, meta, "body")),
        dynamic
          ? liftSequence_X(
              extendScope,
              scope,
              setupEvalFrame({ path, meta: forkMeta((meta = nextMeta(meta))) }),
            )
          : zeroSequence(scope),
        {
          hoisting,
          parent: "closure",
          labels: [],
          completion: VOID_COMPLETION,
          loop: {
            break: null,
            continue: null,
          },
        },
      ),
      path,
    );
  } else {
    return incorporatePrefixStatement(
      bindSequence(
        flatSequence(
          map(
            filter(bindings, ({ variable }) => includes(parameters, variable)),
            ({ variable }) =>
              mapSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { type: "read", mode: getMode(scope), variable },
                  ),
                  path,
                ),
                (cache) =>
                  /** @type {import("../scope/operation").InitializeOperation} */ ({
                    type: "initialize",
                    mode,
                    variable,
                    right: makeReadCacheExpression(cache, path),
                  }),
              ),
          ),
        ),
        (operations) =>
          liftSequenceX(
            concat_,
            liftSequenceX_(
              makeBlockStatement,
              incorporateDeclarationControlBlock(
                liftSequence__X_(
                  makeControlBlock,
                  [],
                  [],
                  incorporatePrefixStatement(
                    bindSequence(
                      liftSequenceXX(
                        extendScope,
                        dynamic
                          ? liftSequence_X(
                              extendScope,
                              scope,
                              setupEvalFrame({
                                path,
                                meta: forkMeta((meta = nextMeta(meta))),
                              }),
                            )
                          : zeroSequence(scope),
                        setupRegularFrame(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          bindings,
                        ),
                      ),
                      (scope) =>
                        liftSequenceXX(
                          concatXX,
                          liftSequenceX_(
                            listEffectStatement,
                            liftSequenceX(
                              flat,
                              flatSequence(
                                map(operations, (operation) =>
                                  listScopeSaveEffect(
                                    { path, meta },
                                    scope,
                                    operation,
                                  ),
                                ),
                              ),
                            ),
                            path,
                          ),
                          unbuildBody(
                            drillSiteArray(drillSite(node, path, meta, "body")),
                            scope,
                            {
                              hoisting,
                              parent: "closure",
                              labels: [],
                              completion: VOID_COMPLETION,
                              loop: {
                                break: null,
                                continue: null,
                              },
                            },
                          ),
                        ),
                    ),
                    path,
                  ),
                  path,
                ),
              ),
              path,
            ),
          ),
      ),
      path,
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
  incorporateDeclarationControlBlock(
    liftSequence__X_(
      makeControlBlock,
      labels,
      EMPTY,
      incorporatePrefixStatement(
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
            parent: "block",
            labels: [],
            completion,
            loop,
          },
        ),
        path,
      ),
      path,
    ),
  );
