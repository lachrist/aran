/* eslint-disable no-use-before-define */

import {
  AranTypeError,
  every,
  flatMap,
  map,
  mapObject,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listScopeInitializeStatement,
  listScopeWriteEffect,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { drill, drillArray } from "../site.mjs";
import { isAssignmentPropertySite, isNotSuperSite } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { listInitCacheNode, makeReadCacheExpression } from "../cache.mjs";
import { listSetSuperEffect } from "../param/index.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/pattern.mjs");

/**
 * @template N
 * @typedef {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../context.d.ts").Root,
 *     scope: import("../scope/index.mjs").Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => N[]} ListFinalNode
 */

/**
 * @template N
 * @typedef {(
 *   effect: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => N} WrapNode
 */

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     iterator: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildItem = (
  { node, path, meta },
  context,
  { iterator, wrapNode, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return unbuildPattern(sites.argument, context, {
        right: makeApplyExpression(
          makeIntrinsicExpression("Array.from", path),
          makePrimitiveExpression({ undefined: null }, path),
          [iterator],
          path,
        ),
        wrapNode,
        listFinalNode,
      });
    }
    default: {
      const metas = splitMeta(meta, ["drill", "iterator"]);
      return listInitCacheNode(
        "constant",
        iterator,
        { path, meta: metas.iterator },
        wrapNode,
        (iterator) =>
          unbuildPattern({ node, path, meta: metas.drill }, context, {
            right: makeGetExpression(
              makeApplyExpression(
                makeGetExpression(
                  makeReadCacheExpression(iterator, path),
                  makePrimitiveExpression("next", path),
                  path,
                ),
                makeReadCacheExpression(iterator, path),
                [],
                path,
              ),
              makePrimitiveExpression("value", path),
              path,
            ),
            wrapNode,
            listFinalNode,
          }),
      );
    }
  }
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.AssignmentProperty>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path, meta },
  context,
  { right, wrapNode, listFinalNode },
) => {
  const { computed } = node;
  const sites = drill({ node, path, meta }, ["key", "value"]);
  return unbuildPattern(sites.value, context, {
    right: makeGetExpression(
      right,
      unbuildKeyExpression(sites.key, context, { computed }),
      path,
    ),
    wrapNode,
    listFinalNode,
  });
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   sites: import("../site.mjs").Site<
 *     estree.AssignmentProperty | estree.RestElement,
 *   >[],
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     keys: import("../cache.mjs").ConstantCache[],
 *     right: import("../cache.mjs").ConstantCache,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPropertyRest = (
  sites,
  context,
  { keys, right, wrapNode, listFinalNode },
) => {
  if (sites.length === 0) {
    return [];
  } else {
    const [{ node, path, meta }, ...tail] = sites;
    switch (node.type) {
      case "RestElement": {
        const metas = splitMeta(meta, ["drill", "rest"]);
        const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
        return [
          ...listInitCacheNode(
            "constant",
            makeApplyExpression(
              makeIntrinsicExpression("Object.assign", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadCacheExpression(right, path)],
              path,
            ),
            { path, meta: metas.rest },
            wrapNode,
            (rest) => [
              ...map(keys, (key) =>
                wrapNode(
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
                  path,
                ),
              ),
              ...unbuildPattern(sites.argument, context, {
                right: makeReadCacheExpression(rest, path),
                wrapNode,
                listFinalNode,
              }),
            ],
          ),
          ...unbuildPropertyRest(tail, context, {
            keys,
            right,
            wrapNode,
            listFinalNode,
          }),
        ];
      }
      case "Property": {
        const { computed } = node;
        const metas = splitMeta(meta, ["drill", "key"]);
        const sites = drill({ node, path, meta: metas.drill }, [
          "key",
          "value",
        ]);
        return listInitCacheNode(
          "constant",
          unbuildKeyExpression(sites.key, context, { computed }),
          { path, meta: metas.key },
          wrapNode,
          (key) => [
            ...unbuildPattern(sites.value, context, {
              right: makeGetExpression(
                makeReadCacheExpression(right, path),
                makeReadCacheExpression(key, path),
                path,
              ),
              wrapNode,
              listFinalNode,
            }),
            ...unbuildPropertyRest(tail, context, {
              keys: [...keys, key],
              right,
              wrapNode,
              listFinalNode,
            }),
          ],
        );
      }
      default: {
        throw new AranTypeError("invalid pattern object property", node);
      }
    }
  }
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path, meta },
  context,
  { right, wrapNode, listFinalNode },
) => {
  switch (node.type) {
    case "Identifier": {
      return listFinalNode(
        context,
        /** @type {estree.Variable} */ (node.name),
        right,
        path,
        meta,
      );
    }
    case "MemberExpression": {
      const { computed } = node;
      const sites = drill({ node, path, meta }, ["object", "property"]);
      if (isNotSuperSite(sites.object)) {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetExpression(
                context.mode,
                unbuildExpression(sites.object, context, {}),
                unbuildKeyExpression(sites.property, context, { computed }),
                right,
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      } else {
        return map(
          listSetSuperEffect(
            context,
            unbuildKeyExpression(sites.property, context, { computed }),
            right,
            { path },
          ),
          (node) => wrapNode(node, path),
        );
      }
    }
    case "AssignmentPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right },
        wrapNode,
        (right) =>
          unbuildPattern(sites.left, context, {
            right: makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              unbuildExpression(sites.right, context, {}),
              makeReadCacheExpression(right, path),
              path,
            ),
            wrapNode,
            listFinalNode,
          }),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, ["drill", "right", "iterator"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["elements"]),
        "elements",
        drillArray,
      );
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right },
        wrapNode,
        (right) =>
          listInitCacheNode(
            "constant",
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
            { path, meta: metas.iterator },
            wrapNode,
            (iterator) => [
              ...flatMap(sites.elements, ({ node, path, meta }) =>
                node === null
                  ? [
                      wrapNode(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeGetExpression(
                              makeReadCacheExpression(iterator, path),
                              makePrimitiveExpression("next", path),
                              path,
                            ),
                            makeReadCacheExpression(iterator, path),
                            [],
                            path,
                          ),
                          path,
                        ),
                        path,
                      ),
                    ]
                  : unbuildItem({ node, path, meta }, context, {
                      iterator: makeReadCacheExpression(iterator, path),
                      wrapNode,
                      listFinalNode,
                    }),
              ),
            ],
          ),
      );
    }
    case "ObjectPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["properties"]),
        "properties",
        drillArray,
      );
      if (every(sites.properties, isAssignmentPropertySite)) {
        // ts shenanigan: preserve type narrowing in callback
        const sites_properties = sites.properties;
        return listInitCacheNode(
          "constant",
          right,
          { path, meta: metas.right },
          wrapNode,
          (right) =>
            flatMap(sites_properties, (site) =>
              unbuildProperty(site, context, {
                right: makeReadCacheExpression(right, path),
                wrapNode,
                listFinalNode,
              }),
            ),
        );
      } else {
        return listInitCacheNode(
          "constant",
          right,
          { path, meta: metas.right },
          wrapNode,
          (right) =>
            unbuildPropertyRest(sites.properties, context, {
              keys: [],
              right,
              wrapNode,
              listFinalNode,
            }),
        );
      }
    }
    case "RestElement": {
      return [
        wrapNode(
          makeExpressionEffect(
            makeSyntaxErrorExpression("Illegal rest element", path),
            path,
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError(LOCATION, node);
    }
  }
};

/**
 * @type {(
 *   node: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
const wrapEffect = (node, _path) => node;

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildPatternEffect = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    wrapNode: wrapEffect,
    listFinalNode: listScopeWriteEffect,
  });

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildPatternStatement = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    wrapNode: makeEffectStatement,
    listFinalNode: listScopeInitializeStatement,
  });
