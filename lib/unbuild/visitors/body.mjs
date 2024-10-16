import { hasDirectEvalCall, hasReturnStatement } from "../query/index.mjs";
import { unbuildBody } from "./statement.mjs";
import {
  concat__,
  concat___,
  EMPTY,
  some,
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
  filterOut,
  filterMap,
} from "../../util/index.mjs";
import {
  listEffectStatement,
  makeIntrinsicExpression,
  makeTreeSegmentBlock,
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
  extendNormalRegularVariable,
  listUpdateResultEffect,
  makeReadResultExpression,
} from "../scope/index.mjs";
import { AranTypeError } from "../../error.mjs";

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *    variables: null | import("estree-sentry").VariableName[],
 *   },
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
export const extendEvalScope = (hash, meta, { variables }, scope) => {
  if (variables === null) {
    return zeroSequence(scope);
  } else {
    return extendEvalVariable(hash, meta, { variables }, scope);
  }
};

/**
 * @type {(
 *   binding: import("../annotation/hoisting").Binding,
 * ) => boolean}
 */
export const isBindingDuplicable = ({ duplicable }) => duplicable;

/**
 * @type {(
 *   binding: import("../annotation/hoisting").Binding,
 * ) => null | import("estree-sentry").VariableName}
 */
export const getDuplicableVariable = (binding) =>
  isBindingDuplicable(binding) ? binding.variable : null;

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   bindings: import("../annotation/hoisting").Binding[],
 * ) => {
 *   selection: import("estree-sentry").VariableName[],
 *   remainder: import("../annotation/hoisting").Binding[],
 * }}
 */
export const extractEvalFrame = (mode, bindings) => {
  switch (mode) {
    case "strict": {
      return { selection: EMPTY, remainder: bindings };
    }
    case "sloppy": {
      return {
        selection: filterMap(bindings, getDuplicableVariable),
        remainder: filterOut(bindings, isBindingDuplicable),
      };
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
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
 *   options: { simple: boolean },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildClosureBody = (node, meta, scope, { simple }) => {
  const { _hash: hash } = node;
  const has_direct_eval_call = !simple && some(node.body, hasDirectEvalCall);
  const bindings = hoist(hash, scope.annotation);
  const { selection, remainder } = has_direct_eval_call
    ? extractEvalFrame(scope.mode, bindings)
    : { selection: null, remainder: bindings };
  return incorporateSegmentBlock(
    liftSequence__X_(
      makeTreeSegmentBlock,
      hasReturnStatement(node) ? RETURN_BREAK_LABEL : null,
      EMPTY,
      incorporateStatement(
        callSequence__X_(
          unbuildBody,
          node.body,
          forkMeta((meta = nextMeta(meta))),
          callSequence___X(
            extendNormalRegularVariable,
            hash,
            forkMeta((meta = nextMeta(meta))),
            { bindings: remainder },
            extendEvalScope(
              hash,
              forkMeta((meta = nextMeta(meta))),
              { variables: selection },
              scope,
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
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").BodyLabeling,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildSegmentBody = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  return incorporateSegmentBlock(
    bindSequence(
      extendNormalRegularVariable(
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
        },
        scope,
      ),
      (scope) =>
        liftSequence__X_(
          makeTreeSegmentBlock,
          labels,
          EMPTY,
          liftSequenceXX(
            concat__,
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
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BlockPrelude,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const unbuildFinallyBody = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  return isCompletion(hash, scope.annotation)
    ? incorporateSegmentBlock(
        bindSequence(
          extendNormalRegularVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            { bindings: hoist(hash, scope.annotation) },
            scope,
          ),
          (scope) =>
            liftSequence__X_(
              makeTreeSegmentBlock,
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
                    concat___,
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
          extendNormalRegularVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            { bindings: hoist(hash, scope.annotation) },
            scope,
          ),
          (scope) =>
            liftSequence__X_(
              makeTreeSegmentBlock,
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
