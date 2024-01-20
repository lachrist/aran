/* eslint-disable no-use-before-define */

import { every, filterNarrow, map, mapIndex } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  EMPTY_EFFECT,
  concatEffect,
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
import { unbuildKey, unbuildKeyExpression } from "./key.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeReadCacheExpression,
} from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
} from "../helper.mjs";
import {
  bindSequence,
  bindTwoSequence,
  flatSequence,
  initSequence,
} from "../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { makeEffectPrelude } from "../prelude.mjs";
import { listEarlyErrorEffect } from "../early-error.mjs";

/**
 * @type {(
 *   node: estree.AssignmentProperty | estree.RestElement,
 * ) => node is estree.AssignmentProperty}
 */
const isAssignmentProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.AssignmentProperty
 *     | estree.RestElement
 *   )>,
 * ) => site is import("../site").Site<estree.RestElement>}
 */
const isRestElementSite = (site) => site.node.type !== "RestElement";

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
 * ) => import("../sequence").EffectSequence}
 */
const unbuildItem = (
  { node, path, meta },
  scope,
  { kind, iterator, next, step },
) => {
  switch (node.type) {
    case "RestElement": {
      return bindSequence(
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
      );
    }
    default: {
      return bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeSequenceExpression(
            makeConditionalEffect(
              makeGetExpression(
                makeReadCacheExpression(step, path),
                makePrimitiveExpression("done", path),
                path,
              ),
              EMPTY_EFFECT,
              listNextIteratorEffect(
                { path },
                { asynchronous: false, iterator, next, step },
              ),
              path,
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
      );
    }
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
 * ) => import("../sequence").EffectSequence}
 */
const unbuildProperty = ({ node, path, meta }, scope, { kind, object }) =>
  bindSequence(
    cacheConstant(
      forkMeta((meta = nextMeta(meta))),
      makeGetExpression(
        makeReadCacheExpression(object, path),
        unbuildKeyExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
          scope,
          { convert: false, computed: node.computed },
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
 *   import("../prelude").NodePrelude,
 *   import("../cache").Cache,
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = ({ node, path, meta }, scope, { kind, object }) =>
  bindSequence(
    cacheConstant(
      forkMeta((meta = nextMeta(meta))),
      unbuildKeyExpression(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
        scope,
        { convert: true, computed: node.computed },
      ),
      path,
    ),
    (key) =>
      bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeGetExpression(
            makeReadCacheExpression(object, path),
            makeReadCacheExpression(key, path),
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
            (setup) => initSequence(map(setup, makeEffectPrelude), key),
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
 *     keys: import("../cache").Cache[],
 *   },
 * ) => import("../sequence").EffectSequence}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  { node, path, meta },
  scope,
  { kind, object, keys },
) =>
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
      concatEffect([
        ...map(keys, (key) =>
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.deleteProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(rest, path),
                makeReadCacheExpression(key, path),
              ],
              path,
            ),
            path,
          ),
        ),
        unbuildPattern(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          { kind, right: rest },
        ),
      ]),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     kind: "var" | "let" | "const" | null,
 *     right: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
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
              right,
            }
          : {
              type: "initialize",
              kind,
              mode,
              variable: /** @type {estree.Variable} */ (node.name),
              right,
              manufactured: false,
            },
      );
    }
    case "MemberExpression": {
      return bindTwoSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        unbuildKey(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "property"),
          scope,
          { computed: node.computed },
        ),
        (object, key) =>
          listSetMemberEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object, key, value: right },
          ),
      );
    }
    case "AssignmentPattern": {
      return bindSequence(
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
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
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
      );
    }
    case "ArrayPattern": {
      return bindSequence(
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
                (step) =>
                  concatEffect([
                    ...mapIndex(node.elements.length, (index) => {
                      if (node.elements[index] == null) {
                        return listNextIteratorEffect(
                          { path },
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
                    listReturnIteratorEffect({ path }, { iterator, step }),
                  ]),
              ),
          ),
      );
    }
    case "ObjectPattern": {
      return concatEffect([
        makeConditionalEffect(
          makeBinaryExpression(
            "==",
            makeReadCacheExpression(right, path),
            makePrimitiveExpression(null, path),
            path,
          ),
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Cannot destructure nullish value",
              path,
            ),
            path,
          ),
          EMPTY_EFFECT,
          path,
        ),
        ...(hasNoRestProperty(node)
          ? mapIndex(node.properties.length, (index) =>
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
            )
          : [
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
                  concatEffect(
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
            ]),
      ]);
    }
    case "RestElement": {
      return listEarlyErrorEffect("Illegal rest element", path);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
