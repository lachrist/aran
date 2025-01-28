/* eslint-disable no-use-before-define */

import {
  EMPTY,
  concat_,
  concat___,
  everyNarrow,
  flatenTree,
  some,
  tuple2,
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence____X,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
  liftSequenceXX,
  concat__,
  flatSequence,
  map,
  liftSequence_XX,
  liftSequence_X,
  callSequence___X,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../error.mjs";
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
import { transNameExpression } from "./expression.mjs";
import { transKey } from "./key.mjs";
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
import { transObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateEffect,
  incorporateFirstEffect,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { convertKey, duplicateKey, makePublicKeyExpression } from "../key.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";
import {
  listInitializeVariableEffect,
  listWriteVariableEffect,
  makeInitVariableOperation,
  makeSaveVariableOperation,
} from "../scope/index.mjs";

/**
 * @type {(
 *   node: null | import("estree-sentry").Node<import("../hash").HashProp>,
 * ) => node is import("estree-sentry").RestElement<import("../hash").HashProp>}
 */
const isRestElement = (node) => node !== null && node.type === "RestElement";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").PatternProperty<import("../hash").HashProp>
 *     | import("estree-sentry").RestElement<import("../hash").HashProp>
 *   ),
 * ) => node is import("estree-sentry").PatternProperty<import("../hash").HashProp>}
 */
const isPatternProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   site: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   iterator: import("../cache").Cache,
 *   next: import("../cache").Cache,
 *   done: import("../cache").WritableCache,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const transItem = (node, meta, scope, kind, iterator, next, done) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return transPattern(
      node.argument,
      meta,
      scope,
      kind,
      makeConditionalExpression(
        makeReadCacheExpression(done, hash),
        makeArrayExpression([], hash),
        makeApplyExpression(
          makeIntrinsicExpression("aran.listIteratorRest", hash),
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
      transPattern,
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
 *   node: import("estree-sentry").PatternProperty<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const transProperty = (node, meta, scope, kind, object) => {
  const { _hash: hash } = node;
  return incorporateFirstEffect(
    bindSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        bindSequence(
          transKey(
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
        transPattern(
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
 *   node: import("estree-sentry").PatternProperty<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 *   keys: import("../cache").Cache,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const transRestProperty = (node, meta, scope, kind, object, keys) => {
  const { _hash: hash } = node;
  return liftSequenceX_(
    tuple2,
    incorporateEffect(
      bindSequence(
        bindSequence(
          mapSequence(
            transKey(
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
          liftSequenceXX(
            concat__,
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
            mapSequence(
              callSequence____X(
                transPattern,
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
              (pair) => {
                // eslint-disable-next-line local/no-impure
                scope = pair[1];
                return pair[0];
              },
            ),
          ),
      ),
      hash,
    ),
    scope,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").RestElement<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   object: import("../cache").Cache,
 *   keys: import("../cache").Cache,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const transRestObject = (node, meta, scope, kind, object, keys) => {
  const { _hash: hash } = node;
  return transPattern(
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
 *   node: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   right: import("../atom").Expression,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const transPattern = (node, meta, scope, kind, right) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "Identifier": {
      switch (kind) {
        case "write": {
          return liftSequenceX_(
            tuple2,
            callSequence___X(
              listWriteVariableEffect,
              hash,
              meta,
              scope,
              makeSaveVariableOperation(hash, scope.mode, node.name, right),
            ),
            scope,
          );
        }
        case "initialize": {
          return callSequence___X(
            listInitializeVariableEffect,
            hash,
            meta,
            scope,
            makeInitVariableOperation(hash, scope.mode, node.name, right),
          );
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
          transObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
          (object) =>
            bindSequence(
              transKey(
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
      return liftSequenceX_(
        tuple2,
        incorporateEffect(
          bindSequence(
            cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
            (right) =>
              mapSequence(
                callSequence____X(
                  transPattern,
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
                    transNameExpression(
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
                (pair) => {
                  // eslint-disable-next-line local/no-impure
                  scope = pair[1];
                  return pair[0];
                },
              ),
          ),
          hash,
        ),
        scope,
      );
    }
    case "ArrayPattern": {
      /**
       * @type {<X>(
       *   pair: [X, import("../scope").Scope],
       * ) => X}
       */
      const updateScope = (pair) => {
        // eslint-disable-next-line local/no-impure
        scope = pair[1];
        return pair[0];
      };
      return liftSequenceX_(
        tuple2,
        incorporateEffect(
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
                          "aran.deadzone_symbol",
                        ),
                        (done) =>
                          liftSequence_XX(
                            concat___,
                            makeWriteCacheEffect(
                              done,
                              makePrimitiveExpression(false, hash),
                              hash,
                            ),
                            flatSequence(
                              map(node.elements, (node) => {
                                if (node === null) {
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
                                  return liftSequenceX(
                                    updateScope,
                                    transItem(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      iterator,
                                      next,
                                      done,
                                    ),
                                  );
                                }
                              }),
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
                                    liftSequenceX(
                                      flatenTree,
                                      listReturnIteratorEffect(
                                        hash,
                                        forkMeta((meta = nextMeta(meta))),
                                        { iterator },
                                      ),
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
        ),
        scope,
      );
    }
    case "ObjectPattern": {
      /**
       * @type {<X>(
       *   pair: [X, import("../scope").Scope],
       * ) => X}
       */
      const updateScope = (pair) => {
        // eslint-disable-next-line local/no-impure
        scope = pair[1];
        return pair[0];
      };
      return liftSequenceX_(
        tuple2,
        incorporateEffect(
          bindSequence(
            cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
            (right) =>
              liftSequence_X(
                concat__,
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
                  ? flatSequence(
                      map(node.properties, (node) =>
                        liftSequenceX(
                          updateScope,
                          transProperty(
                            node,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            kind,
                            right,
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
                          flatSequence(
                            map(node.properties, (node) => {
                              switch (node.type) {
                                case "Property": {
                                  return liftSequenceX(
                                    updateScope,
                                    transRestProperty(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      right,
                                      keys,
                                    ),
                                  );
                                }
                                case "RestElement": {
                                  return liftSequenceX(
                                    updateScope,
                                    transRestObject(
                                      node,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      kind,
                                      right,
                                      keys,
                                    ),
                                  );
                                }
                                default: {
                                  throw new AranTypeError(node);
                                }
                              }
                            }),
                          ),
                      ),
                      hash,
                    ),
              ),
          ),
          hash,
        ),
        scope,
      );
    }
    case "RestElement": {
      return liftSequenceX_(
        tuple2,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal rest element", hash),
          hash,
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
 *   node: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   right: import("../atom").Expression,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
export const transWritePattern = (node, meta, scope1, right) =>
  mapSequence(
    transPattern(node, meta, scope1, "write", right),
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
 *   node: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   right: import("../atom").Expression,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const transInitializePattern = (node, meta, scope, right) =>
  transPattern(node, meta, scope, "initialize", right);
