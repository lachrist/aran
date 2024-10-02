/* eslint-disable no-use-before-define */

import {
  EMPTY,
  concatXX,
  concat_,
  concat_X,
  concat_XX,
  concat___,
  everyNarrow,
  filterNarrow,
  flat,
  map,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
  makeNextIteratorExpression,
} from "../helper.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateEffect,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { convertKey, duplicateKey, makePublicKeyExpression } from "../key.mjs";

/**
 * @type {(
 *   node: null | import("estree-sentry").Node<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").RestElement<import("../../hash").HashProp>}
 */
const isRestElement = (node) => node !== null && node.type === "RestElement";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").PatternProperty<import("../../hash").HashProp>
 *     | import("estree-sentry").RestElement<import("../../hash").HashProp>
 *   ),
 * ) => node is import("estree-sentry").PatternProperty<import("../../hash").HashProp>}
 */
const isPatternProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   right: import("../atom").Expression,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const" | null,
 *   },
 * ) => import("../context").PatterContext}
 */
export const makePatternContext = (right, { scope, annotation, kind }) => ({
  kind,

  right,
  scope,
  annotation,
});

/**
 * @type {(
 *   site: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const" | null,
 *     iterator: import("../cache").Cache,
 *     next: import("../cache").Cache,
 *     done: import("../cache").WritableCache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildItem = (
  node,
  meta,
  { scope, annotation, kind, iterator, next, done },
) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return unbuildPattern(node.argument, meta, {
      scope,
      annotation,
      kind,
      right: makeConditionalExpression(
        makeReadCacheExpression(done, hash),
        makeArrayExpression([], hash),
        makeApplyExpression(
          makeIntrinsicExpression("aran.listRest", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(iterator, hash),
            makeReadCacheExpression(next, hash),
          ],
          hash,
        ),
        hash,
      ),
    });
  } else {
    return callSequence__X(
      unbuildPattern,
      node,
      forkMeta((meta = nextMeta(meta))),
      liftSequenceX_(
        makePatternContext,
        makeNextIteratorExpression(hash, forkMeta((meta = nextMeta(meta))), {
          asynchronous: false,
          iterator,
          next,
          done,
        }),
        { scope, annotation, kind },
      ),
    );
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").PatternProperty<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildProperty = (node, meta, { scope, annotation, kind, object }) => {
  const { _hash: hash } = node;
  return incorporateEffect(
    bindSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        bindSequence(
          unbuildKey(node.key, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
            computed: node.computed,
          }),
          (key) =>
            makePublicKeyExpression(hash, convertKey(hash, key), {
              message: "Illegal private key in destructuring pattern",
            }),
        ),
        hash,
      ),
      (key) =>
        unbuildPattern(node.value, forkMeta((meta = nextMeta(meta))), {
          kind,
          scope,
          annotation,
          right: makeGetExpression(
            makeReadCacheExpression(object, hash),
            makeReadCacheExpression(key, hash),
            hash,
          ),
        }),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").PatternProperty<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *     keys: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = (
  node,
  meta,
  { scope, annotation, kind, object, keys },
) => {
  const { _hash: hash } = node;
  return incorporateEffect(
    bindSequence(
      bindSequence(
        mapSequence(
          unbuildKey(node.key, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
            computed: node.computed,
          }),
          (key) => convertKey(hash, key),
        ),
        (key) => duplicateKey(hash, forkMeta((meta = nextMeta(meta))), key),
      ),
      ([key1, key2]) =>
        liftSequenceXX(
          concat_X,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.set", hash),
              makeIntrinsicExpression("undefined", hash),
              liftSequence_X_(
                concat___,
                makeReadCacheExpression(keys, hash),
                makePublicKeyExpression(hash, key1, {
                  message: "Illegal private key in destructuring pattern",
                }),
                makePrimitiveExpression(null, hash),
              ),
              hash,
            ),
            hash,
          ),
          callSequence__X(
            unbuildPattern,
            node.value,
            forkMeta((meta = nextMeta(meta))),
            liftSequenceX_(
              makePatternContext,
              liftSequence_X_(
                makeGetExpression,
                makeReadCacheExpression(object, hash),
                makePublicKeyExpression(hash, key2, {
                  message: "Illegal private key in destructuring pattern",
                }),
                hash,
              ),
              { scope, annotation, kind },
            ),
          ),
        ),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").RestElement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *     keys: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  node,
  meta,
  { scope, annotation, kind, object, keys },
) => {
  const { _hash: hash } = node;
  return unbuildPattern(node.argument, meta, {
    scope,
    annotation,
    kind,
    right: makeApplyExpression(
      makeIntrinsicExpression("aran.sliceObject", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeApplyExpression(
          makeIntrinsicExpression("Object", hash),
          makeIntrinsicExpression("undefined", hash),
          [makeReadCacheExpression(object, hash)],
          hash,
        ),
        makeReadCacheExpression(keys, hash),
      ],
      hash,
    ),
  });
};

/**
 * @type {(
 *   site: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").PatterContext,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildPattern = (
  node,
  meta,
  { scope, annotation, right, kind },
) => {
  const { _hash: hash } = node;
  const mode = getMode(scope);
  switch (node.type) {
    case "Identifier": {
      return listScopeSaveEffect(
        hash,
        meta,
        scope,
        kind === null
          ? {
              type: "write",
              mode,
              variable: node.name,
              right,
            }
          : {
              type: "initialize",
              mode,
              variable: node.name,
              right,
            },
      );
    }
    case "MemberExpression": {
      return bindSequence(
        unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        (object) =>
          bindSequence(
            unbuildKey(node.property, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              computed: node.computed,
            }),
            (key) =>
              listSetMemberEffect(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {
                  object,
                  key,
                  value: right,
                },
              ),
          ),
      );
    }
    case "AssignmentPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
          (right) =>
            callSequence__X(
              unbuildPattern,
              node.left,
              forkMeta((meta = nextMeta(meta))),
              liftSequenceX_(
                makePatternContext,
                liftSequence_X__(
                  makeConditionalExpression,
                  makeBinaryExpression(
                    "===",
                    makeReadCacheExpression(right, hash),
                    makeIntrinsicExpression("undefined", hash),
                    hash,
                  ),
                  unbuildNameExpression(
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    {
                      scope,
                      annotation,
                      name:
                        node.left.type === "Identifier"
                          ? {
                              type: "assignment",
                              variable: node.left.name,
                            }
                          : { type: "anonymous" },
                    },
                  ),
                  makeReadCacheExpression(right, hash),
                  hash,
                ),
                { kind, scope, annotation },
              ),
            ),
        ),
        hash,
      );
    }
    case "ArrayPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
          (right) =>
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeApplyExpression(
                  makeGetExpression(
                    makeReadCacheExpression(right, hash),
                    makeIntrinsicExpression("Symbol.iterator", hash),
                    hash,
                  ),
                  makeReadCacheExpression(right, hash),
                  [],
                  hash,
                ),
                hash,
              ),
              (iterator) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeGetExpression(
                      makeReadCacheExpression(iterator, hash),
                      makePrimitiveExpression("next", hash),
                      hash,
                    ),
                    hash,
                  ),
                  (next) =>
                    bindSequence(
                      cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        "aran.deadzone",
                      ),
                      (done) =>
                        liftSequence_XX(
                          concat_XX,
                          makeWriteCacheEffect(
                            done,
                            makePrimitiveExpression(false, hash),
                            hash,
                          ),
                          liftSequenceX(
                            flat,
                            flatSequence(
                              map(node.elements, (node) => {
                                if (node == null) {
                                  return listNextIteratorEffect(
                                    hash,
                                    forkMeta((meta = nextMeta(meta))),
                                    {
                                      asynchronous: false,
                                      iterator,
                                      next,
                                      done,
                                    },
                                  );
                                } else {
                                  return unbuildItem(
                                    node,
                                    forkMeta((meta = nextMeta(meta))),
                                    {
                                      scope,
                                      annotation,
                                      kind,
                                      iterator,
                                      next,
                                      done,
                                    },
                                  );
                                }
                              }),
                            ),
                          ),
                          // Not only it is not necessary to return the iterator
                          // But the 'next' variable will be outdated and `next.done`
                          // might be false which would cause the iterator to return.
                          some(node.elements, isRestElement)
                            ? EMPTY_SEQUENCE
                            : liftSequenceX(
                                concat_,
                                liftSequence__X_(
                                  makeConditionalEffect,
                                  makeReadCacheExpression(done, hash),
                                  EMPTY,
                                  listReturnIteratorEffect(
                                    hash,
                                    forkMeta((meta = nextMeta(meta))),
                                    { iterator },
                                  ),
                                  hash,
                                ),
                              ),
                        ),
                    ),
                ),
            ),
        ),
        hash,
      );
    }
    case "ObjectPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
          (right) =>
            liftSequence_X(
              concat_X,
              makeConditionalEffect(
                makeBinaryExpression(
                  "==",
                  makeReadCacheExpression(right, hash),
                  makePrimitiveExpression(null, hash),
                  hash,
                ),
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "TypeError",
                      "Cannot destructure nullish value",
                      hash,
                    ),
                    hash,
                  ),
                ],
                EMPTY,
                hash,
              ),
              everyNarrow(node.properties, isPatternProperty)
                ? liftSequenceX(
                    flat,
                    flatSequence(
                      map(node.properties, (node) =>
                        unbuildProperty(
                          node,
                          forkMeta((meta = nextMeta(meta))),
                          { scope, annotation, kind, object: right },
                        ),
                      ),
                    ),
                  )
                : incorporateEffect(
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.createObject", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [makePrimitiveExpression(null, hash)],
                          hash,
                        ),
                        hash,
                      ),
                      (keys) =>
                        liftSequenceXX(
                          concatXX,
                          liftSequenceX(
                            flat,
                            flatSequence(
                              map(
                                filterNarrow(
                                  node.properties,
                                  isPatternProperty,
                                ),
                                (node) =>
                                  unbuildRestProperty(
                                    node,
                                    forkMeta((meta = nextMeta(meta))),
                                    {
                                      scope,
                                      annotation,
                                      kind,
                                      object: right,
                                      keys,
                                    },
                                  ),
                              ),
                            ),
                          ),
                          liftSequenceX(
                            flat,
                            flatSequence(
                              map(
                                filterNarrow(node.properties, isRestElement),
                                (node) =>
                                  unbuildRestObject(
                                    node,
                                    forkMeta((meta = nextMeta(meta))),
                                    {
                                      scope,
                                      annotation,
                                      kind,
                                      object: right,
                                      keys,
                                    },
                                  ),
                              ),
                            ),
                          ),
                        ),
                    ),
                    hash,
                  ),
            ),
        ),
        hash,
      );
    }
    case "RestElement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal rest element", hash),
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
