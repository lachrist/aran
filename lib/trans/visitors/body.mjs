import { transBody } from "./statement.mjs";
import {
  concat__,
  concat___,
  EMPTY,
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
  some,
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
import { AranExecError, AranTypeError } from "../../error.mjs";

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   options: {
 *    variables: null | import("estree-sentry").VariableName[],
 *   },
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("../scope/index.d.ts").Scope,
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
 *   kind: import("../annotation/hoisting.d.ts").Kind,
 * ) => boolean}
 */
export const isClosureBodyKind = (kind) => {
  if (kind === "var" || kind === "function-sloppy-away") {
    return true;
  } else if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "function-strict" ||
    kind === "function-sloppy-near"
  ) {
    return false;
  } else if (
    kind === "arguments" ||
    kind === "class-self" ||
    kind === "function-self-sloppy" ||
    kind === "function-self-strict" ||
    kind === "error-complex" ||
    kind === "error-simple" ||
    kind === "param-complex" ||
    kind === "param-simple" ||
    kind === "import"
  ) {
    throw new AranExecError("unexpected body kind", { kind });
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   binding: import("../annotation/hoisting.d.ts").FrameEntry,
 * ) => boolean}
 */
const isClosureBodyBinding = ({ 1: kinds }) => some(kinds, isClosureBodyKind);

/**
 * @type {(
 *   binding: import("../annotation/hoisting.d.ts").FrameEntry,
 * ) => null | import("estree-sentry").VariableName}
 */
const getClosureVariable = ({ 0: variable, 1: kinds }) =>
  some(kinds, isClosureBodyKind) ? variable : null;

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   bindings: import("../annotation/hoisting.d.ts").FrameEntry[],
 * ) => {
 *   selection: import("estree-sentry").VariableName[],
 *   remainder: import("../annotation/hoisting.d.ts").FrameEntry[],
 * }}
 */
const extractEvalFrame = (mode, bindings) => {
  switch (mode) {
    case "strict": {
      return { selection: EMPTY, remainder: bindings };
    }
    case "sloppy": {
      return {
        selection: filterMap(bindings, getClosureVariable),
        remainder: filterOut(bindings, isClosureBodyBinding),
      };
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
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
 *   node: import("estree-sentry").BlockStatement<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     has_direct_eval_call: boolean,
 *     has_return_statement: boolean,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BlockPrelude,
 *   import("../atom.d.ts").SegmentBlock,
 * >}
 */
export const transClosureBody = (
  node,
  meta,
  scope,
  { has_direct_eval_call, has_return_statement },
) => {
  const { _hash: hash } = node;
  const bindings = hoist(hash, scope.annotation);
  const { selection, remainder } = has_direct_eval_call
    ? extractEvalFrame(scope.mode, bindings)
    : { selection: null, remainder: bindings };
  return incorporateSegmentBlock(
    liftSequence__X_(
      makeTreeSegmentBlock,
      has_return_statement ? RETURN_BREAK_LABEL : null,
      EMPTY,
      incorporateStatement(
        callSequence__X_(
          transBody,
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
 *   node: import("estree-sentry").Statement<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   labeling: import("../labeling.d.ts").BodyLabeling,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BlockPrelude,
 *   import("../atom.d.ts").SegmentBlock,
 * >}
 */
export const transSegmentBody = (node, meta, scope, { labels, loop }) => {
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
            transBody(
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
 *   node: import("estree-sentry").BlockStatement<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   labeling: import("../labeling.d.ts").BodyLabeling,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BlockPrelude,
 *   import("../atom.d.ts").SegmentBlock,
 * >}
 */
export const transFinallyBody = (node, meta, scope, { labels, loop }) => {
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
                    transBody(
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
              transBody(node.body, forkMeta((meta = nextMeta(meta))), scope, {
                labels: EMPTY,
                loop,
              }),
              hash,
            ),
        ),
        hash,
      );
};
