/* eslint-disable no-use-before-define */

import {
  EMPTY,
  concat_,
  concat_X,
  concat_XX,
  concat___,
  everyNarrow,
  flat,
  some,
  tuple2,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
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
  callSequence____X,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapReduceSequence,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateFirstEffect,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { convertKey, duplicateKey, makePublicKeyExpression } from "../key.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";
import {
  listInitializeVariableEffect,
  listWriteVariableEffect,
} from "../scope/index.mjs";

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
 *   site: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   iterator: import("../cache").Cache,
 *   next: import("../cache").Cache,
 *   done: import("../cache").WritableCache,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const unbuildItem = (node, meta, scope, kind, iterator, next, done) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return unbuildPattern(
      node.argument,
      meta,
      scope,
      kind,
      makeConditionalExpression(
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
    );
  } else {
    return callSequence____X(
      unbuildPattern,
      node,
      forkMeta((meta = nextMeta(meta))),
      scope,
      kind,
      makeNextIteratorExpression(hash, forkMeta((meta = nextMeta(meta))), {
        asynchronous: false,
        iterator,
        next,
        done,
      }),
    );
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").PatternProperty<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const unbuildProperty = (node, meta, scope, kind, object) => {
  const { _hash: hash } = node;
  return incorporateFirstEffect(
    bindSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        bindSequence(
          unbuildKey(
            node.key,
            forkMeta((meta = nextMeta(meta))),
            scope,
            node.computed,
          ),
          (key) =>
            makePublicKeyExpression(hash, convertKey(hash, key), {
              message: "Illegal private key in destructuring pattern",
            }),
        ),
        hash,
      ),
      (key) =>
        unbuildPattern(
          node.value,
          forkMeta((meta = nextMeta(meta))),
          scope,
          kind,
          makeGetExpression(
            makeReadCacheExpression(object, hash),
            makeReadCacheExpression(key, hash),
            hash,
          ),
        ),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").PatternProperty<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 *   keys: import("../cache").Cache,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = (node, meta, scope, kind, object, keys) => {
  const { _hash: hash } = node;
  return incorporateFirstEffect(
    bindSequence(
      bindSequence(
        mapSequence(
          unbuildKey(
            node.key,
            forkMeta((meta = nextMeta(meta))),
            scope,
            node.computed,
          ),
          (key) => convertKey(hash, key),
        ),
        (key) => duplicateKey(hash, forkMeta((meta = nextMeta(meta))), key),
      ),
      ([key1, key2]) =>
        bindSequence(
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
          (part1) =>
            bindSequence(
              callSequence____X(
                unbuildPattern,
                node.value,
                forkMeta((meta = nextMeta(meta))),
                scope,
                kind,
                liftSequence_X_(
                  makeGetExpression,
                  makeReadCacheExpression(object, hash),
                  makePublicKeyExpression(hash, key2, {
                    message: "Illegal private key in destructuring pattern",
                  }),
                  hash,
                ),
              ),
              ({ 0: part2, 1: scope }) =>
                zeroSequence(tuple2(concat_X(part1, part2), scope)),
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
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 *   keys: import("../cache").Cache,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (node, meta, scope, kind, object, keys) => {
  const { _hash: hash } = node;
  return unbuildPattern(
    node.argument,
    meta,
    scope,
    kind,
    makeApplyExpression(
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
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   right: import("../atom").Expression,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildPattern = (node, meta, scope, kind, right) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "Identifier": {
      switch (kind) {
        case "write": {
          return liftSequenceX_(
            tuple2,
            listWriteVariableEffect(hash, meta, scope, {
              variable: node.name,
              right,
            }),
            scope,
          );
        }
        case "initialize": {
          return listInitializeVariableEffect(hash, meta, scope, {
            variable: node.name,
            right,
          });
        }
        default: {
          throw new AranTypeError(kind);
        }
      }
    }
    case "MemberExpression": {
      return liftSequenceX_(
        tuple2,
        bindSequence(
          unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
          (object) =>
            bindSequence(
              unbuildKey(
                node.property,
                forkMeta((meta = nextMeta(meta))),
                scope,
                node.computed,
              ),
              (key) =>
                listSetMemberEffect(
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { object, key, value: right },
                ),
            ),
        ),
        scope,
      );
    }
    case "AssignmentPattern": {
      return incorporateFirstEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
          (right) =>
            callSequence____X(
              unbuildPattern,
              node.left,
              forkMeta((meta = nextMeta(meta))),
              scope,
              kind,
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
                  scope,
                  node.left.type === "Identifier"
                    ? {
                        type: "assignment",
                        variable: node.left.name,
                      }
                    : ANONYMOUS_NAME,
                ),
                makeReadCacheExpression(right, hash),
                hash,
              ),
            ),
        ),
        hash,
      );
    }
    case "ArrayPattern": {
      return incorporateFirstEffect(
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
                        bindSequence(
                          zeroSequence(
                            makeWriteCacheEffect(
                              done,
                              makePrimitiveExpression(false, hash),
                              hash,
                            ),
                          ),
                          (part1) =>
                            bindSequence(
                              mapReduceSequence(
                                node.elements,
                                (node, scope) => {
                                  if (node === null) {
                                    return liftSequenceX_(
                                      tuple2,
                                      listNextIteratorEffect(
                                        hash,
                                        forkMeta((meta = nextMeta(meta))),
                                        {
                                          asynchronous: false,
                                          iterator,
                                          next,
                                          done,
                                        },
                                      ),
                                      scope,
                                    );
                                  } else {
                                    return unbuildItem(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      iterator,
                                      next,
                                      done,
                                    );
                                  }
                                },
                                scope,
                              ),
                              ({ 0: part2, 1: scope }) =>
                                bindSequence(
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
                                  (part3) =>
                                    zeroSequence(
                                      tuple2(
                                        concat_XX(part1, flat(part2), part3),
                                        scope,
                                      ),
                                    ),
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
      return incorporateFirstEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
          (right) =>
            bindSequence(
              zeroSequence(
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
              ),
              (part1) =>
                everyNarrow(node.properties, isPatternProperty)
                  ? mapSequence(
                      mapReduceSequence(
                        node.properties,
                        (node, scope) =>
                          unbuildProperty(
                            node,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            kind,
                            right,
                          ),
                        scope,
                      ),
                      ({ 0: part2, 1: scope }) =>
                        tuple2(concat_X(part1, flat(part2)), scope),
                    )
                  : incorporateFirstEffect(
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
                          bindSequence(
                            mapReduceSequence(
                              node.properties,
                              (node, scope) => {
                                switch (node.type) {
                                  case "Property": {
                                    return unbuildRestProperty(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      right,
                                      keys,
                                    );
                                  }
                                  case "RestElement": {
                                    return unbuildRestObject(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      right,
                                      keys,
                                    );
                                  }
                                  default: {
                                    throw new AranTypeError(node);
                                  }
                                }
                              },
                              scope,
                            ),
                            ({ 0: part2, 1: scope }) =>
                              zeroSequence(
                                tuple2(concat_X(part1, flat(part2)), scope),
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
      return liftSequenceX_(
        tuple2,
        liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal rest element", hash),
            hash,
          ),
        ),
        scope,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   right: import("../atom").Expression,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildWritePattern = (node, meta, scope1, right) =>
  mapSequence(
    unbuildPattern(node, meta, scope1, "write", right),
    ({ 0: part, 1: scope2 }) => {
      if (scope1 !== scope2) {
        throw new AranExecError(
          "scope should not have been modified in assignment",
          { node, scope1, scope2 },
        );
      } else {
        return part;
      }
    },
  );

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   right: import("../atom").Expression,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Effect[],
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildInitializePattern = (node, meta, scope, right) =>
  unbuildPattern(node, meta, scope, "initialize", right);
