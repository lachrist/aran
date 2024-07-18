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
  mapIndex,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
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
import { drillDeepSite, drillSite } from "../site.mjs";
import { incorporateEffect, initErrorExpression } from "../prelude/index.mjs";
import { convertKey, duplicateKey, makePublicKeyExpression } from "../key.mjs";

/**
 * @type {(
 *   node: import("../../estree").AssignmentProperty | import("../../estree").RestElement,
 * ) => node is import("../../estree").AssignmentProperty}
 */
const isAssignmentProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   node: import("../../estree").Pattern | null,
 * ) => node is import("../../estree").RestElement}
 */
const isRestElement = (node) => node != null && node.type === "RestElement";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").AssignmentProperty
 *     | import("../../estree").RestElement
 *   )>,
 * ) => site is import("../site").Site<import("../../estree").RestElement>}
 */
const isRestElementSite = (site) => site.node.type === "RestElement";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").AssignmentProperty
 *     | import("../../estree").RestElement
 *   )>,
 * ) => site is import("../site").Site<
 *   import("../../estree").AssignmentProperty
 * >}
 */
const isAssignmentPropertySite = (site) => site.node.type === "Property";

/**
 * @type {(
 *   node: import("../../estree").ObjectPattern,
 * ) => node is import("../../estree").ObjectPattern & {
 *   properties: import("../../estree").AssignmentProperty[],
 * }}
 */
const hasNoRestProperty = (node) =>
  everyNarrow(node.properties, isAssignmentProperty);

/**
 * @type {(
 *   kind: "var" | "let" | "const" | null,
 *   right: import("../atom").Expression,
 * ) => {
 *   kind: "var" | "let" | "const" | null,
 *   right: import("../atom").Expression,
 * }}
 */
export const makePatternContext = (kind, right) => ({ kind, right });

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
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
  { node, path, meta },
  scope,
  { kind, iterator, next, done },
) => {
  if (node.type === "RestElement") {
    return unbuildPattern(
      drillSite(node, path, meta, "argument"),
      scope,
      makePatternContext(
        kind,
        makeConditionalExpression(
          makeReadCacheExpression(done, path),
          makeArrayExpression([], path),
          makeApplyExpression(
            makeIntrinsicExpression("aran.listRest", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeReadCacheExpression(iterator, path),
              makeReadCacheExpression(next, path),
            ],
            path,
          ),
          path,
        ),
      ),
    );
  } else {
    return callSequence__X(
      unbuildPattern,
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      scope,
      liftSequence_X(
        makePatternContext,
        kind,
        makeNextIteratorExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          { asynchronous: false, iterator, next, done },
        ),
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").AssignmentProperty>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildProperty = ({ node, path, meta }, scope, { kind, object }) =>
  callSequence__X(
    unbuildPattern,
    drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
    scope,
    liftSequence_X(
      makePatternContext,
      kind,
      liftSequence_X_(
        makeGetExpression,
        makeReadCacheExpression(object, path),
        bindSequence(
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            scope,
            { computed: node.computed },
          ),
          (key) =>
            makePublicKeyExpression({ path }, key, {
              message: "Illegal private key in destructuring pattern",
            }),
        ),
        path,
      ),
    ),
  );

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").AssignmentProperty
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
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
  { node, path, meta },
  scope,
  { kind, object, keys },
) =>
  incorporateEffect(
    bindSequence(
      bindSequence(
        mapSequence(
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            scope,
            { computed: node.computed },
          ),
          (key) => convertKey({ path }, key),
        ),
        (key) =>
          duplicateKey({ path, meta: forkMeta((meta = nextMeta(meta))) }, key),
      ),
      ([key1, key2]) =>
        liftSequenceXX(
          concat_X,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.set", path),
              makeIntrinsicExpression("undefined", path),
              liftSequence_X_(
                concat___,
                makeReadCacheExpression(keys, path),
                makePublicKeyExpression({ path }, key1, {
                  message: "Illegal private key in destructuring pattern",
                }),
                makePrimitiveExpression(null, path),
              ),
              path,
            ),
            path,
          ),
          callSequence__X(
            unbuildPattern,
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
            scope,
            liftSequence_X(
              makePatternContext,
              kind,
              liftSequence_X_(
                makeGetExpression,
                makeReadCacheExpression(object, path),
                makePublicKeyExpression({ path }, key2, {
                  message: "Illegal private key in destructuring pattern",
                }),
                path,
              ),
            ),
          ),
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").RestElement>,
 *   scope: import("../scope").Scope,
 *   options: {
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
  { node, path, meta },
  scope,
  { kind, object, keys },
) =>
  unbuildPattern(
    drillSite(node, path, meta, "argument"),
    scope,
    makePatternContext(
      kind,
      makeApplyExpression(
        makeIntrinsicExpression("aran.sliceObject", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object", path),
            makeIntrinsicExpression("undefined", path),
            [makeReadCacheExpression(object, path)],
            path,
          ),
          makeReadCacheExpression(keys, path),
        ],
        path,
      ),
    ),
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     right: import("../atom").Expression,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildPattern = (
  { node, path, meta },
  scope,
  { right, kind },
) => {
  const mode = getMode(scope);
  switch (node.type) {
    case "Identifier": {
      return listScopeSaveEffect(
        { path, meta },
        scope,
        kind === null
          ? {
              type: "write",
              mode,
              variable: /** @type {import("../../estree").Variable} */ (
                node.name
              ),
              right,
            }
          : {
              type: "initialize",
              mode,
              variable: /** @type {import("../../estree").Variable} */ (
                node.name
              ),
              right,
            },
      );
    }
    case "MemberExpression": {
      return bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        (object) =>
          bindSequence(
            unbuildKey(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "property",
              ),
              scope,
              { computed: node.computed },
            ),
            (key) =>
              listSetMemberEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { object, key, value: right },
              ),
          ),
      );
    }
    case "AssignmentPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            callSequence__X(
              unbuildPattern,
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
              scope,
              liftSequence_X(
                makePatternContext,
                kind,
                liftSequence_X__(
                  makeConditionalExpression,
                  makeBinaryExpression(
                    "===",
                    makeReadCacheExpression(right, path),
                    makeIntrinsicExpression("undefined", path),
                    path,
                  ),
                  unbuildNameExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "right",
                    ),
                    scope,
                    {
                      name:
                        node.left.type === "Identifier"
                          ? {
                              type: "assignment",
                              variable:
                                /** @type {import("../../estree").Variable} */ (
                                  node.left.name
                                ),
                            }
                          : { type: "anonymous" },
                    },
                  ),
                  makeReadCacheExpression(right, path),
                  path,
                ),
              ),
            ),
        ),
        path,
      );
    }
    case "ArrayPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeApplyExpression(
                  makeGetExpression(
                    makeReadCacheExpression(right, path),
                    makeIntrinsicExpression("Symbol.iterator", path),
                    path,
                  ),
                  makeReadCacheExpression(right, path),
                  [],
                  path,
                ),
                path,
              ),
              (iterator) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeGetExpression(
                      makeReadCacheExpression(iterator, path),
                      makePrimitiveExpression("next", path),
                      path,
                    ),
                    path,
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
                            makePrimitiveExpression(false, path),
                            path,
                          ),
                          liftSequenceX(
                            flat,
                            flatSequence(
                              mapIndex(node.elements.length, (index) => {
                                if (node.elements[index] == null) {
                                  return listNextIteratorEffect(
                                    {
                                      path,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    {
                                      asynchronous: false,
                                      iterator,
                                      next,
                                      done,
                                    },
                                  );
                                } else {
                                  return unbuildItem(
                                    /** @type {import("../site").Site<import("../../estree").Pattern>} */ (
                                      drillDeepSite(
                                        node,
                                        path,
                                        forkMeta((meta = nextMeta(meta))),
                                        "elements",
                                        index,
                                      )
                                    ),
                                    scope,
                                    { kind, iterator, next, done },
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
                                  makeReadCacheExpression(done, path),
                                  EMPTY,
                                  listReturnIteratorEffect(
                                    {
                                      path,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    { iterator },
                                  ),
                                  path,
                                ),
                              ),
                        ),
                    ),
                ),
            ),
        ),
        path,
      );
    }
    case "ObjectPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            liftSequence_X(
              concat_X,
              makeConditionalEffect(
                makeBinaryExpression(
                  "==",
                  makeReadCacheExpression(right, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "TypeError",
                      "Cannot destructure nullish value",
                      path,
                    ),
                    path,
                  ),
                ],
                EMPTY,
                path,
              ),
              hasNoRestProperty(node)
                ? liftSequenceX(
                    flat,
                    flatSequence(
                      mapIndex(node.properties.length, (index) =>
                        unbuildProperty(
                          drillDeepSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "properties",
                            index,
                          ),
                          scope,
                          { kind, object: right },
                        ),
                      ),
                    ),
                  )
                : incorporateEffect(
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.createObject", path),
                          makeIntrinsicExpression("undefined", path),
                          [makePrimitiveExpression(null, path)],
                          path,
                        ),
                        path,
                      ),
                      (keys) =>
                        liftSequenceXX(
                          concatXX,
                          liftSequenceX(
                            flat,
                            flatSequence(
                              map(
                                filterNarrow(
                                  mapIndex(node.properties.length, (index) =>
                                    drillDeepSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "properties",
                                      index,
                                    ),
                                  ),
                                  isAssignmentPropertySite,
                                ),
                                (site) =>
                                  unbuildRestProperty(site, scope, {
                                    kind,
                                    object: right,
                                    keys,
                                  }),
                              ),
                            ),
                          ),
                          liftSequenceX(
                            flat,
                            flatSequence(
                              map(
                                filterNarrow(
                                  mapIndex(node.properties.length, (index) =>
                                    drillDeepSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "properties",
                                      index,
                                    ),
                                  ),
                                  isRestElementSite,
                                ),
                                (site) =>
                                  unbuildRestObject(site, scope, {
                                    kind,
                                    object: right,
                                    keys,
                                  }),
                              ),
                            ),
                          ),
                        ),
                    ),
                    path,
                  ),
            ),
        ),
        path,
      );
    }
    case "RestElement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal rest element", path),
          path,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
