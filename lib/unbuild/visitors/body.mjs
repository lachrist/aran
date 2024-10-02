import { hasDirectEvalCall, hasReturnStatement } from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { concatXX, concatXXX, EMPTY, some } from "../../util/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import {
  listEffectStatement,
  makeControlBlock,
  makeIntrinsicExpression,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateControlBlock,
} from "../prelude/index.mjs";
import { RETURN_BREAK_LABEL } from "../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { hoist, isCompletion } from "../annotation/index.mjs";

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   annotation: import("../annotation").Annotation,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const listResetCompletionStatement = (hash, meta, scope, annotation) =>
  isCompletion(hash, annotation)
    ? liftSequenceX_(
        listEffectStatement,
        listScopeSaveEffect(hash, meta, scope, {
          type: "update-result",
          mode: getMode(scope),
          result: null,
        }),
        hash,
      )
    : EMPTY_SEQUENCE;

/**
 * @type {(
 *   node: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     simple: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildClosureBody = (
  node,
  meta,
  { scope, annotation, simple },
) => {
  const { _hash: hash } = node;
  return incorporateControlBlock(
    liftSequence__X_(
      makeControlBlock,
      hasReturnStatement(node) ? [RETURN_BREAK_LABEL] : EMPTY,
      EMPTY,
      incorporateStatement(
        callSequence__X(
          unbuildBody,
          node.body,
          forkMeta((meta = nextMeta(meta))),
          mapSequence(
            liftSequence_X(
              extendScope,
              scope,
              !simple &&
                getMode(scope) === "sloppy" &&
                some(node.body, hasDirectEvalCall)
                ? setupEvalFrame(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    hoist(hash, annotation),
                  )
                : setupRegularFrame(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    hoist(hash, annotation),
                  ),
            ),
            (scope) => ({
              scope,
              annotation,

              labels: [],
              origin: /** @type {"closure"} */ ("closure"),
              loop: {
                break: null,
                continue: null,
              },
            }),
          ),
        ),
        hash,
      ),
      hash,
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").Statement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   options: import("../context").StatementContext,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildControlBody = (
  node,
  meta,
  { scope, annotation, origin, labels, loop },
) => {
  const { _hash: hash } = node;
  return incorporateControlBlock(
    bindSequence(
      liftSequence_X(
        extendScope,
        scope,
        //
        // Why not:
        //
        // setupRegularFrame(
        //   { hash },
        //   listBinding(
        //     node.type === "BlockStatement"
        //       ? listBinding(hoisting, hash)
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
          hash,
          forkMeta((meta = nextMeta(meta))),
          hoist(hash, annotation),
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
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              annotation,
            ),
            unbuildBody(
              node.type === "BlockStatement" ? node.body : [node],
              forkMeta((meta = nextMeta(meta))),
              {
                scope,
                annotation,
                origin,
                labels: [],
                loop,
              },
            ),
          ),
          hash,
        ),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").StatementContext,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").ControlBlock,
 * >}
 */
export const unbuildFinallyBody = (
  node,
  meta,
  { scope, annotation, origin, labels, loop },
) => {
  const { _hash: hash } = node;
  return isCompletion(hash, annotation)
    ? incorporateControlBlock(
        bindSequence(
          liftSequence_X(
            extendScope,
            scope,
            setupRegularFrame(
              hash,
              forkMeta((meta = nextMeta(meta))),
              hoist(hash, annotation),
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
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    {
                      type: "backup-result",
                      mode: getMode(scope),
                    },
                  ),
                  hash,
                ),
                (backup) =>
                  liftSequenceXXX(
                    concatXXX,
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "update-result",
                          mode: getMode(scope),
                          result: makeIntrinsicExpression("undefined", hash),
                        },
                      ),
                      hash,
                    ),
                    unbuildBody(node.body, forkMeta((meta = nextMeta(meta))), {
                      scope,
                      annotation,
                      origin,
                      labels: [],
                      loop,
                    }),
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "update-result",
                          mode: getMode(scope),
                          result: makeReadCacheExpression(backup, hash),
                        },
                      ),
                      hash,
                    ),
                  ),
              ),
              hash,
            ),
        ),
        hash,
      )
    : incorporateControlBlock(
        bindSequence(
          liftSequence_X(
            extendScope,
            scope,
            setupRegularFrame(
              hash,
              forkMeta((meta = nextMeta(meta))),
              hoist(hash, annotation),
            ),
          ),
          (scope) =>
            liftSequence__X_(
              makeControlBlock,
              labels,
              EMPTY,
              unbuildBody(node.body, forkMeta((meta = nextMeta(meta))), {
                scope,
                annotation,
                origin,
                labels: EMPTY,
                loop,
              }),
              hash,
            ),
        ),
        hash,
      );
};
