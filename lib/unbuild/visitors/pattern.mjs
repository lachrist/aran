/* eslint-disable no-use-before-define */

import {
  EMPTY,
  concatXX,
  concat_,
  concat_X,
  concat_XX,
  every,
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
  makeSequenceExpression,
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
} from "../helper.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX__,
  liftSequence_X,
  liftSequence_XX,
  liftSequence_X_,
  liftSequence__X_,
  mapSequence,
} from "../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { makePrefixPrelude } from "../prelude.mjs";
import { listEarlyErrorEffect } from "../early-error.mjs";
import {
  convertKey,
  duplicateKey,
  makeKeyExpression,
  makePublicKeyExpression,
} from "../key.mjs";
import { cleanupEffect, cleanupExpression } from "../cleanup.mjs";

/**
 * @type {(
 *   node: estree.AssignmentProperty | estree.RestElement,
 * ) => node is estree.AssignmentProperty}
 */
const isAssignmentProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   node: estree.Pattern | null,
 * ) => node is estree.RestElement}
 */
const isRestElement = (node) => node != null && node.type === "RestElement";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.AssignmentProperty
 *     | estree.RestElement
 *   )>,
 * ) => site is import("../site").Site<estree.RestElement>}
 */
const isRestElementSite = (site) => site.node.type === "RestElement";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.AssignmentProperty
 *     | estree.RestElement
 *   )>,
 * ) => site is import("../site").Site<estree.AssignmentProperty>}
 */
const isAssignmentPropertySite = (site) => site.node.type === "Property";

/**
 * @type {(
 *   node: estree.ObjectPattern,
 * ) => node is estree.ObjectPattern & {
 *   properties: estree.AssignmentProperty[],
 * }}
 */
const hasNoRestProperty = (node) =>
  every(node.properties, isAssignmentProperty);

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     iterator: import("../cache").Cache,
 *     next: import("../cache").Cache,
 *     step: import("../cache").WritableCache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
const unbuildItem = (
  { node, path, meta },
  scope,
  { kind, iterator, next, step },
) => {
  if (node.type === "RestElement") {
    return cleanupEffect(
      bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeConditionalExpression(
            makeGetExpression(
              makeReadCacheExpression(step, path),
              makePrimitiveExpression("done", path),
              path,
            ),
            makeArrayExpression([], path),
            makeApplyExpression(
              makeIntrinsicExpression("aran.listRest", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(iterator, path),
                makeReadCacheExpression(next, path),
              ],
              path,
            ),
            path,
          ),
          path,
        ),
        (rest) =>
          unbuildPattern(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            scope,
            { kind, right: rest },
          ),
      ),
      path,
    );
  } else {
    return cleanupEffect(
      bindSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          liftSequenceX__(
            makeSequenceExpression,
            liftSequenceX(
              concat_,
              liftSequence__X_(
                makeConditionalEffect,
                makeGetExpression(
                  makeReadCacheExpression(step, path),
                  makePrimitiveExpression("done", path),
                  path,
                ),
                EMPTY,
                listNextIteratorEffect(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  { asynchronous: false, iterator, next, step },
                ),
                path,
              ),
            ),
            makeConditionalExpression(
              makeGetExpression(
                makeReadCacheExpression(step, path),
                makePrimitiveExpression("done", path),
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              makeGetExpression(
                makeReadCacheExpression(step, path),
                makePrimitiveExpression("value", path),
                path,
              ),
              path,
            ),
            path,
          ),
          path,
        ),
        (right) =>
          unbuildPattern(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { kind, right },
          ),
      ),
      path,
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.AssignmentProperty>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
const unbuildProperty = ({ node, path, meta }, scope, { kind, object }) =>
  cleanupEffect(
    bindSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        liftSequence_X_(
          makeGetExpression,
          makeReadCacheExpression(object, path),
          cleanupExpression(
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
          path,
        ),
        path,
      ),
      (right) =>
        unbuildPattern(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
          scope,
          { kind, right },
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<
 *     estree.AssignmentProperty
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../key").Key,
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = ({ node, path, meta }, scope, { kind, object }) =>
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
      bindSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          liftSequence_X_(
            makeGetExpression,
            makeReadCacheExpression(object, path),
            makePublicKeyExpression({ path }, key1, {
              message: "Illegal private key in destructuring pattern",
            }),
            path,
          ),
          path,
        ),
        (right) =>
          bindSequence(
            unbuildPattern(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
              scope,
              { kind, right },
            ),
            (setup) => initSequence(map(setup, makePrefixPrelude), key2),
          ),
      ),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.RestElement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *     keys: import("../key").Key[],
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  { node, path, meta },
  scope,
  { kind, object, keys },
) =>
  cleanupEffect(
    bindSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeApplyExpression(
          makeIntrinsicExpression("Object.assign", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeApplyExpression(
              makeIntrinsicExpression("Object.create", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeIntrinsicExpression("Object.prototype", path)],
              path,
            ),
            makeReadCacheExpression(object, path),
          ],
          path,
        ),
        path,
      ),
      (rest) =>
        liftSequence_X(
          concatXX,
          map(keys, (key) =>
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.deleteProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(rest, path),
                  makeKeyExpression({ path }, key),
                ],
                path,
              ),
              path,
            ),
          ),
          unbuildPattern(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            scope,
            { kind, right: rest },
          ),
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     right: import("../cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
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
              variable: /** @type {estree.Variable} */ (node.name),
              right: makeReadCacheExpression(right, path),
            }
          : {
              type: "initialize",
              kind,
              mode,
              variable: /** @type {estree.Variable} */ (node.name),
              right: makeReadCacheExpression(right, path),
              manufactured: false,
            },
      );
    }
    case "MemberExpression": {
      return cleanupEffect(
        bindSequence(
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
                  { object, key, value: makeReadCacheExpression(right, path) },
                ),
            ),
        ),
        path,
      );
    }
    case "AssignmentPattern": {
      return cleanupEffect(
        bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
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
                          variable: /** @type {estree.Variable} */ (
                            node.left.name
                          ),
                        }
                      : { type: "anonymous" },
                },
              ),
              makeReadCacheExpression(right, path),
              path,
            ),
            path,
          ),
          (right) =>
            unbuildPattern(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
              scope,
              { kind, right },
            ),
        ),
        path,
      );
    }
    case "ArrayPattern": {
      return cleanupEffect(
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
                    {
                      type: "intrinsic",
                      intrinsic: "aran.deadzone",
                    },
                    path,
                  ),
                  (step) =>
                    liftSequence_XX(
                      concat_XX,
                      makeWriteCacheEffect(
                        step,
                        makeApplyExpression(
                          makeIntrinsicExpression("Object.fromEntries", path),
                          makePrimitiveExpression({ undefined: null }, path),
                          [
                            makeArrayExpression(
                              [
                                makeArrayExpression(
                                  [
                                    makePrimitiveExpression("done", path),
                                    makePrimitiveExpression(false, path),
                                  ],
                                  path,
                                ),
                              ],
                              path,
                            ),
                          ],
                          path,
                        ),
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
                                { asynchronous: false, iterator, next, step },
                              );
                            } else {
                              return unbuildItem(
                                /** @type {import("../site").Site<estree.Pattern>} */ (
                                  drillDeepSite(
                                    node,
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "elements",
                                    index,
                                  )
                                ),
                                scope,
                                { kind, iterator, next, step },
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
                        : listReturnIteratorEffect(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            { iterator, step },
                          ),
                    ),
                ),
            ),
        ),
        path,
      );
    }
    case "ObjectPattern": {
      return liftSequence_X(
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
          : cleanupEffect(
              bindSequence(
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
                      }),
                  ),
                ),
                (keys) =>
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
              path,
            ),
      );
    }
    case "RestElement": {
      return listEarlyErrorEffect("Illegal rest element", path);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
