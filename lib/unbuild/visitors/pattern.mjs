/* eslint-disable no-use-before-define */

import { AranTypeError, every, flatMap, map } from "../../util/index.mjs";
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
import { splitMeta, zipMeta } from "../mangle.mjs";
import {
  listScopeInitializeStatement,
  listScopeSetSuperEffect,
  listScopeWriteEffect,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import {
  isAssignmentProperty,
  isNotSuperMemberExpression,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { listInitCacheNode, makeReadCacheExpression } from "../cache.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/pattern.mjs");

/**
 * @template N
 * @typedef {(
 *   context: {
 *     strict: boolean,
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
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     iterator: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildItem = (
  { node, path },
  context,
  { meta, iterator, wrapNode, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      return unbuildPattern(drill({ node, path }, "argument"), context, {
        meta,
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
      const metas = splitMeta(meta, ["item", "iterator_cache"]);
      return listInitCacheNode(
        "constant",
        iterator,
        { path, meta: metas.iterator_cache },
        wrapNode,
        (iterator) =>
          unbuildPattern({ node, path }, context, {
            meta: metas.item,
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
 *   pair: {
 *     node: estree.AssignmentProperty,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path },
  context,
  { meta, right, wrapNode, listFinalNode },
) => {
  const metas = splitMeta(meta, ["key", "value"]);
  return unbuildPattern(drill({ node, path }, "value"), context, {
    meta: metas.value,
    right: makeGetExpression(
      right,
      unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta: metas.key,
        computed: node.computed,
      }),
      path,
    ),
    wrapNode,
    listFinalNode,
  });
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pairs: [
 *     unbuild.Meta,
 *     {
 *       node: estree.AssignmentProperty | estree.RestElement,
 *       path: unbuild.Path,
 *     },
 *   ][],
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
  pairs,
  context,
  { keys, right, wrapNode, listFinalNode },
) => {
  if (pairs.length === 0) {
    return [];
  } else {
    const [[meta, { node, path }], ...tail] = pairs;
    switch (node.type) {
      case "RestElement": {
        const metas = splitMeta(meta, ["argument", "rest_cache"]);
        return [
          ...listInitCacheNode(
            "constant",
            makeApplyExpression(
              makeIntrinsicExpression("Object.assign", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadCacheExpression(right, path)],
              path,
            ),
            { path, meta: metas.rest_cache },
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
              ...unbuildPattern(drill({ node, path }, "argument"), context, {
                meta: metas.argument,
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
        const metas = splitMeta(meta, ["key", "value", "key_cache"]);
        return listInitCacheNode(
          "constant",
          unbuildKeyExpression(drill({ node, path }, "key"), context, {
            meta: metas.key,
            computed: node.computed,
          }),
          { path, meta: metas.key_cache },
          wrapNode,
          (key) => [
            ...unbuildPattern(drill({ node, path }, "value"), context, {
              meta: metas.value,
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
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path },
  context,
  { meta, right, wrapNode, listFinalNode },
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
      if (isNotSuperMemberExpression(node)) {
        const metas = splitMeta(meta, ["object", "key"]);
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                unbuildExpression(drill({ node, path }, "object"), context, {
                  meta: metas.object,
                }),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    meta: metas.key,
                    computed: node.computed,
                  },
                ),
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
          listScopeSetSuperEffect(
            context,
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta,
              computed: node.computed,
            }),
            right,
            path,
          ),
          (node) => wrapNode(node, path),
        );
      }
    }
    case "AssignmentPattern": {
      const metas = splitMeta(meta, ["left", "right_cache", "right"]);
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right_cache },
        wrapNode,
        (right) =>
          unbuildPattern(drill({ node, path }, "left"), context, {
            meta: metas.left,
            right: makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                meta: metas.right,
              }),
              makeReadCacheExpression(right, path),
              path,
            ),
            wrapNode,
            listFinalNode,
          }),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, [
        "elements",
        "right_cache",
        "iterator_cache",
      ]);
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right_cache },
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
            { path, meta: metas.iterator_cache },
            wrapNode,
            (iterator) => [
              ...flatMap(
                zipMeta(
                  metas.elements,
                  drillAll(drillArray({ node, path }, "elements")),
                ),
                ([meta, { node, path }]) =>
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
                    : unbuildItem({ node, path }, context, {
                        meta,
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
      if (every(node.properties, isAssignmentProperty)) {
        const metas = splitMeta(meta, ["properties", "right_cache"]);
        return listInitCacheNode(
          "constant",
          right,
          { path, meta: metas.right_cache },
          wrapNode,
          (right) =>
            flatMap(
              zipMeta(
                metas.properties,
                drillAll(drillArray({ node, path }, "properties")),
              ),
              ([meta, pair]) =>
                unbuildProperty(
                  /** @type {{node: estree.AssignmentProperty, path: unbuild.Path}} */ (
                    pair
                  ),
                  context,
                  {
                    meta,
                    right: makeReadCacheExpression(right, path),
                    wrapNode,
                    listFinalNode,
                  },
                ),
            ),
        );
      } else {
        const metas = splitMeta(meta, ["properties", "right_cache"]);
        return listInitCacheNode(
          "constant",
          right,
          { path, meta: metas.right_cache },
          wrapNode,
          (right) =>
            unbuildPropertyRest(
              zipMeta(
                metas.properties,
                drillAll(drillArray({ node, path }, "properties")),
              ),
              context,
              {
                keys: [],
                right,
                wrapNode,
                listFinalNode,
              },
            ),
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
 *   effect: aran.Effect<unbuild.Atom>,
 * ) => aran.Effect<unbuild.Atom>}
 */
const wrapEffect = (effect) => effect;

/**
 * @type {(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildPatternEffect = (
  { node, path },
  context,
  { meta, right },
) =>
  unbuildPattern({ node, path }, context, {
    meta,
    right,
    wrapNode: wrapEffect,
    listFinalNode: listScopeWriteEffect,
  });

/**
 * @type {(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildPatternStatement = (
  { node, path },
  context,
  { meta, right },
) =>
  unbuildPattern({ node, path }, context, {
    meta,
    right,
    wrapNode: makeEffectStatement,
    listFinalNode: listScopeInitializeStatement,
  });
