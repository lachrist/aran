import { hasDirectEvalCall, hasReturnStatement } from "../query/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { concatXX, concatXXX, EMPTY, some } from "../../util/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X_,
  callSequence___X,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceX_,
  liftSequence__X_,
  zeroSequence,
} from "../../sequence.mjs";
import {
  listEffectStatement,
  makeSegmentBlock,
  makeIntrinsicExpression,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateStatement,
  incorporateSegmentBlock,
} from "../prelude/index.mjs";
import { RETURN_BREAK_LABEL } from "../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  hoist,
  isCompletion,
  makeSloppyFunctionFakeHash,
} from "../annotation/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import {
  extendEvalVariable,
  extendRegularVariable,
  listUpdateResultEffect,
  makeReadResultExpression,
} from "../scope/index.mjs";

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const listResetCompletionStatement = (hash, meta, scope) =>
  isCompletion(hash, scope.annotation)
    ? liftSequenceX_(
        listEffectStatement,
        listUpdateResultEffect(hash, meta, scope, {
          origin: "program",
          result: null,
        }),
        hash,
      )
    : EMPTY_SEQUENCE;

/**
 * @type {(
 *   node: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   simple: boolean,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildClosureBody = (node, meta, scope, simple) => {
  const { _hash: hash } = node;
  return incorporateSegmentBlock(
    liftSequence__X_(
      makeSegmentBlock,
      hasReturnStatement(node) ? [RETURN_BREAK_LABEL] : EMPTY,
      EMPTY,
      incorporateStatement(
        callSequence__X_(
          unbuildBody,
          node.body,
          forkMeta((meta = nextMeta(meta))),
          callSequence___X(
            extendRegularVariable,
            hash,
            forkMeta((meta = nextMeta(meta))),
            {
              bindings: hoist(hash, scope.annotation),
              links: EMPTY,
            },
            !simple &&
              scope.mode === "sloppy" &&
              some(node.body, hasDirectEvalCall)
              ? extendEvalVariable(
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  {},
                  scope,
                )
              : zeroSequence(scope),
          ),
          INITIAL_STATEMENT_LABELING,
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
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").BodyLabeling,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildSegmentBody = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  return incorporateSegmentBlock(
    bindSequence(
      extendRegularVariable(
        hash,
        forkMeta((meta = nextMeta(meta))),
        {
          bindings:
            node.type === "BlockStatement"
              ? hoist(hash, scope.annotation)
              : // (() => {
                //   console.log({ f }); // { f: undefined }
                //   if (true)
                //     function f() {
                //       return (f = 123, f);
                //     }
                //   console.log({ f, g: f() }); // { f : [Function: f], g: 123 }
                // })();
                node.type === "FunctionDeclaration" && scope.mode === "sloppy"
                ? hoist(makeSloppyFunctionFakeHash(hash), scope.annotation)
                : EMPTY,
          links: EMPTY,
        },
        scope,
      ),
      (scope) =>
        liftSequence__X_(
          makeSegmentBlock,
          labels,
          EMPTY,
          liftSequenceXX(
            concatXX,
            listResetCompletionStatement(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            unbuildBody(
              node.type === "BlockStatement" ? node.body : [node],
              forkMeta((meta = nextMeta(meta))),
              scope,
              { labels: EMPTY, loop },
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
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").BodyLabeling,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildFinallyBody = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  return isCompletion(hash, scope.annotation)
    ? incorporateSegmentBlock(
        bindSequence(
          extendRegularVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            {
              bindings: hoist(hash, scope.annotation),
              links: EMPTY,
            },
            scope,
          ),
          (scope) =>
            liftSequence__X_(
              makeSegmentBlock,
              labels,
              EMPTY,
              bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeReadResultExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    {},
                  ),
                  hash,
                ),
                (backup) =>
                  liftSequenceXXX(
                    concatXXX,
                    liftSequenceX_(
                      listEffectStatement,
                      listUpdateResultEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          origin: "program",
                          result: makeIntrinsicExpression("undefined", hash),
                        },
                      ),
                      hash,
                    ),
                    unbuildBody(
                      node.body,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      { labels: EMPTY, loop },
                    ),
                    liftSequenceX_(
                      listEffectStatement,
                      listUpdateResultEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          origin: "program",
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
    : incorporateSegmentBlock(
        bindSequence(
          extendRegularVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            {
              bindings: hoist(hash, scope.annotation),
              links: EMPTY,
            },
            scope,
          ),
          (scope) =>
            liftSequence__X_(
              makeSegmentBlock,
              labels,
              EMPTY,
              unbuildBody(node.body, forkMeta((meta = nextMeta(meta))), scope, {
                labels: EMPTY,
                loop,
              }),
              hash,
            ),
        ),
        hash,
      );
};
