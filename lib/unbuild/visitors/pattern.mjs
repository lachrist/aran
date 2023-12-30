/* eslint-disable no-use-before-define */

import {
  every,
  filterNarrow,
  flatMap,
  flatMapIndex,
  map,
  mapIndex,
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
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildKey, unbuildKeyExpression } from "./key.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
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
  flatSequence,
  initSequence,
  mapSequence,
  mapTwoSequence,
  sequenceEffect,
} from "../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";

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
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     iterator: import("../cache.d.ts").Cache,
 *     next: import("../cache.d.ts").Cache,
 *     step: import("../cache.d.ts").WritableCache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildItem = (
  { node, path, meta },
  scope,
  { operation, iterator, next, step },
) => {
  switch (node.type) {
    case "RestElement": {
      return sequenceEffect(
        mapSequence(
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
              { operation, right: rest },
            ),
        ),
        path,
      );
    }
    default: {
      return sequenceEffect(
        mapSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeSequenceExpression(
              [
                makeConditionalEffect(
                  makeGetExpression(
                    makeReadCacheExpression(step, path),
                    makePrimitiveExpression("done", path),
                    path,
                  ),
                  [],
                  listNextIteratorEffect(
                    { path },
                    { asynchronous: false, iterator, next, step },
                  ),
                  path,
                ),
              ],
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
              { operation, right },
            ),
        ),
        path,
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.AssignmentProperty>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     object: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildProperty = ({ node, path, meta }, scope, { operation, object }) =>
  sequenceEffect(
    mapSequence(
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
          { operation, right },
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.AssignmentProperty
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     object: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../sequence.js").EffectSequence<
 *   import("../cache.d.ts").Cache
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = (
  { node, path, meta },
  scope,
  { operation, object },
) =>
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
          initSequence(
            unbuildPattern(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
              scope,
              { operation, right },
            ),
            key,
          ),
      ),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.RestElement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     object: import("../cache").Cache,
 *     keys: import("../cache").Cache[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  { node, path, meta },
  scope,
  { operation, object, keys },
) =>
  sequenceEffect(
    mapSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeApplyExpression(
          makeIntrinsicExpression("Object.assign", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeObjectExpression(
              makeIntrinsicExpression("Object.prototype", path),
              [],
              path,
            ),
            makeReadCacheExpression(object, path),
          ],
          path,
        ),
        path,
      ),
      (rest) => [
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
        ...unbuildPattern(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          { operation, right: rest },
        ),
      ],
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     right: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildPattern = (
  { node, path, meta },
  scope,
  { right, operation },
) => {
  const mode = getMode(scope);
  switch (node.type) {
    case "Identifier": {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: operation,
        mode,
        variable: /** @type {estree.Variable} */ (node.name),
        right,
      });
    }
    case "MemberExpression": {
      return sequenceEffect(
        mapTwoSequence(
          unbuildObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
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
          (object, key) =>
            listSetMemberEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { object, key, value: right },
            ),
        ),
        path,
      );
    }
    case "AssignmentPattern": {
      return sequenceEffect(
        mapSequence(
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
              { right, operation },
            ),
        ),
        path,
      );
    }
    case "ArrayPattern": {
      return sequenceEffect(
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
                mapSequence(
                  cacheWritable(
                    forkMeta((meta = nextMeta(meta))),
                    makeObjectExpression(
                      makePrimitiveExpression(null, path),
                      [
                        [
                          makePrimitiveExpression("done", path),
                          makePrimitiveExpression(false, path),
                        ],
                      ],
                      path,
                    ),
                    path,
                  ),
                  (step) => [
                    ...flatMapIndex(node.elements.length, (index) => {
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
                          { iterator, next, step, operation },
                        );
                      }
                    }),
                    ...listReturnIteratorEffect({ path }, { iterator, step }),
                  ],
                ),
            ),
        ),
        path,
      );
    }
    case "ObjectPattern": {
      return [
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
          [],
          path,
        ),
        ...(hasNoRestProperty(node)
          ? flatMapIndex(node.properties.length, (index) =>
              unbuildProperty(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "properties",
                  index,
                ),
                scope,
                { operation, object: right },
              ),
            )
          : sequenceEffect(
              mapSequence(
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
                        operation,
                        object: right,
                      }),
                  ),
                ),
                (keys) =>
                  flatMap(
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
                        operation,
                        object: right,
                        keys,
                      }),
                  ),
              ),
              path,
            )),
      ];
    }
    case "RestElement": {
      return [
        makeExpressionEffect(
          makeEarlyErrorExpression("Illegal rest element", path),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid pattern node", node);
    }
  }
};
