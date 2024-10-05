import { hasDirectEvalCall, hasReturnStatement } from "../query/index.mjs";
import {
  extendScope,
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
  callSequence__X_,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence__X_,
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
import { updateContextScope } from "../context.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const listResetCompletionStatement = (hash, meta, context) =>
  isCompletion(hash, context.annotation)
    ? liftSequenceX_(
        listEffectStatement,
        listScopeSaveEffect(hash, meta, context.scope, {
          type: "update-result",
          mode: context.mode,
          result: null,
        }),
        hash,
      )
    : EMPTY_SEQUENCE;

/**
 * @type {(
 *   node: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   simple: boolean,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildClosureBody = (node, meta, context, simple) => {
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
          liftSequence_X(
            updateContextScope,
            context,
            liftSequence_X(
              extendScope,
              context.scope,
              !simple &&
                context.mode === "sloppy" &&
                some(node.body, hasDirectEvalCall)
                ? setupEvalFrame(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    hoist(hash, context.annotation),
                  )
                : setupRegularFrame(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    hoist(hash, context.annotation),
                  ),
            ),
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
 *   context: import("../context").Context,
 *   labeling: import("../labeling").BodyLabeling,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildSegmentBody = (node, meta, context, { labels, loop }) => {
  const { _hash: hash } = node;
  return incorporateSegmentBlock(
    bindSequence(
      liftSequence_X(
        updateContextScope,
        context,
        liftSequence_X(
          extendScope,
          context.scope,
          setupRegularFrame(
            hash,
            forkMeta((meta = nextMeta(meta))),
            node.type === "BlockStatement"
              ? hoist(hash, context.annotation)
              : // (() => {
                //   console.log({ f }); // { f: undefined }
                //   if (true)
                //     function f() {
                //       return (f = 123, f);
                //     }
                //   console.log({ f, g: f() }); // { f : [Function: f], g: 123 }
                // })();
                node.type === "FunctionDeclaration" && context.mode === "sloppy"
                ? hoist(makeSloppyFunctionFakeHash(hash), context.annotation)
                : EMPTY,
          ),
        ),
      ),
      (context) =>
        liftSequence__X_(
          makeSegmentBlock,
          labels,
          EMPTY,
          liftSequenceXX(
            concatXX,
            listResetCompletionStatement(
              hash,
              forkMeta((meta = nextMeta(meta))),
              context,
            ),
            unbuildBody(
              node.type === "BlockStatement" ? node.body : [node],
              forkMeta((meta = nextMeta(meta))),
              context,
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
 *   context: import("../context").Context,
 *   labeling: import("../labeling").BodyLabeling,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildFinallyBody = (node, meta, context, { labels, loop }) => {
  const { _hash: hash } = node;
  return isCompletion(hash, context.annotation)
    ? incorporateSegmentBlock(
        bindSequence(
          liftSequence_X(
            updateContextScope,
            context,
            liftSequence_X(
              extendScope,
              context.scope,
              setupRegularFrame(
                hash,
                forkMeta((meta = nextMeta(meta))),
                hoist(hash, context.annotation),
              ),
            ),
          ),
          (context) =>
            liftSequence__X_(
              makeSegmentBlock,
              labels,
              EMPTY,
              bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeScopeLoadExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    context.scope,
                    {
                      type: "backup-result",
                      mode: context.mode,
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
                        context.scope,
                        {
                          type: "update-result",
                          mode: context.mode,
                          result: makeIntrinsicExpression("undefined", hash),
                        },
                      ),
                      hash,
                    ),
                    unbuildBody(
                      node.body,
                      forkMeta((meta = nextMeta(meta))),
                      context,
                      { labels: EMPTY, loop },
                    ),
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        context.scope,
                        {
                          type: "update-result",
                          mode: context.mode,
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
          liftSequence_X(
            updateContextScope,
            context,
            liftSequence_X(
              extendScope,
              context.scope,
              setupRegularFrame(
                hash,
                forkMeta((meta = nextMeta(meta))),
                hoist(hash, context.annotation),
              ),
            ),
          ),
          (context) =>
            liftSequence__X_(
              makeSegmentBlock,
              labels,
              EMPTY,
              unbuildBody(
                node.body,
                forkMeta((meta = nextMeta(meta))),
                context,
                { labels: EMPTY, loop },
              ),
              hash,
            ),
        ),
        hash,
      );
};
