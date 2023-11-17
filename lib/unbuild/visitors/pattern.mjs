/* eslint-disable no-use-before-define */

import { every, flatMap, map, mapObject } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeApplyExpression,
  makeArrowExpression,
  makeClosureBlock,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
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
import { splitMeta } from "../mangle.mjs";
import {
  listScopeInitializeStatement,
  listScopeWriteEffect,
  makeScopeClosureBlock,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isAssignmentPropertySite,
  isNotSuperSite,
  isPrivateIdentifierSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import {
  listInitCacheNode,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { getPrivateKey } from "../query/index.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/pattern.mjs");

/**
 * @template N
 * @typedef {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.js").RootProgram,
 *     scope: import("../scope/index.mjs").Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => N[]} ListFinalNode
 */

/**
 * @template N
 * @typedef {(
 *   node: aran.Effect<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => N} WrapEffect
 */

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     iterable: import("../cache.mjs").Cache,
 *     step: import("../cache.mjs").WritableCache,
 *     wrapEffect: WrapEffect<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildItem = (
  { node, path, meta },
  context,
  { iterable, step, wrapEffect, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return unbuildPattern(sites.argument, context, {
        right: makeConditionalExpression(
          makeGetExpression(
            makeReadCacheExpression(step, path),
            makePrimitiveExpression("done", path),
            path,
          ),
          makeArrayExpression([], path),
          makeApplyExpression(
            makeIntrinsicExpression("Array.from", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeObjectExpression(
                makePrimitiveExpression(null, path),
                [
                  [
                    makeIntrinsicExpression("Symbol.iterator", path),
                    makeArrowExpression(
                      false,
                      false,
                      makeScopeClosureBlock(
                        context,
                        { link: null, kinds: {} },
                        (_context) =>
                          makeClosureBlock(
                            [],
                            [],
                            makeObjectExpression(
                              makeReadCacheExpression(iterable, path),
                              [
                                [
                                  makePrimitiveExpression("return", path),
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                ],
                              ],
                              path,
                            ),
                            path,
                          ),
                        path,
                      ),
                      path,
                    ),
                  ],
                ],
                path,
              ),
            ],
            path,
          ),
          path,
        ),
        wrapEffect,
        listFinalNode,
      });
    }
    default: {
      return unbuildPattern({ node, path, meta }, context, {
        right: makeConditionalExpression(
          makeGetExpression(
            makeReadCacheExpression(step, path),
            makePrimitiveExpression("done", path),
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          makeSequenceExpression(
            makeWriteCacheEffect(
              step,
              makeApplyExpression(
                makeGetExpression(
                  makeReadCacheExpression(iterable, path),
                  makePrimitiveExpression("next", path),
                  path,
                ),
                makeReadCacheExpression(iterable, path),
                [],
                path,
              ),
              path,
            ),
            makeGetExpression(
              makeReadCacheExpression(step, path),
              makePrimitiveExpression("value", path),
              path,
            ),
            path,
          ),
          path,
        ),
        wrapEffect,
        listFinalNode,
      });
    }
  }
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.AssignmentProperty>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapEffect: WrapEffect<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path, meta },
  context,
  { right, wrapEffect, listFinalNode },
) => {
  const { computed } = node;
  const sites = drill({ node, path, meta }, ["key", "value"]);
  return unbuildPattern(sites.value, context, {
    right: makeGetExpression(
      right,
      unbuildKeyExpression(sites.key, context, { convert: false, computed }),
      path,
    ),
    wrapEffect,
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
 *     wrapEffect: WrapEffect<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPropertyRest = (
  sites,
  context,
  { keys, right, wrapEffect, listFinalNode },
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
            wrapEffect,
            (rest) => [
              ...map(keys, (key) =>
                wrapEffect(
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
                wrapEffect,
                listFinalNode,
              }),
            ],
          ),
          ...unbuildPropertyRest(tail, context, {
            keys,
            right,
            wrapEffect,
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
          unbuildKeyExpression(sites.key, context, { convert: true, computed }),
          { path, meta: metas.key },
          wrapEffect,
          (key) => [
            ...unbuildPattern(sites.value, context, {
              right: makeGetExpression(
                makeReadCacheExpression(right, path),
                makeReadCacheExpression(key, path),
                path,
              ),
              wrapEffect,
              listFinalNode,
            }),
            ...unbuildPropertyRest(tail, context, {
              keys: [...keys, key],
              right,
              wrapEffect,
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
 *     wrapEffect: WrapEffect<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path, meta },
  context,
  { right, wrapEffect, listFinalNode },
) => {
  switch (node.type) {
    case "Identifier": {
      return listFinalNode(
        context,
        /** @type {estree.Variable} */ (node.name),
        right,
        { path, meta },
      );
    }
    case "MemberExpression": {
      const { computed } = node;
      const metas = splitMeta(meta, ["drill", "set"]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "object",
        "property",
      ]);
      return map(
        listSetMemberEffect(
          context,
          isNotSuperSite(sites.object)
            ? unbuildExpression(sites.object, context, {})
            : "super",
          isPrivateIdentifierSite(sites.property)
            ? getPrivateKey(sites.property.node)
            : unbuildKeyExpression(sites.property, context, {
                convert: false,
                computed,
              }),
          right,
          { path, meta: metas.set },
        ),
        (node) => wrapEffect(node, path),
      );
    }
    case "AssignmentPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right },
        wrapEffect,
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
            wrapEffect,
            listFinalNode,
          }),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, ["drill", "iterator", "iterable", "step"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["elements"]),
        "elements",
        drillArray,
      );
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.iterator },
        wrapEffect,
        (iterator) =>
          listInitCacheNode(
            "constant",
            makeApplyExpression(
              makeGetExpression(
                makeReadCacheExpression(iterator, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                path,
              ),
              makeReadCacheExpression(iterator, path),
              [],
              path,
            ),
            { path, meta: metas.iterable },
            wrapEffect,
            (iterable) =>
              listInitCacheNode(
                "writable",
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
                { path, meta: metas.step },
                wrapEffect,
                (step) => [
                  ...flatMap(sites.elements, ({ node, path, meta }) =>
                    node === null
                      ? [
                          wrapEffect(
                            makeWriteCacheEffect(
                              step,
                              makeApplyExpression(
                                makeGetExpression(
                                  makeReadCacheExpression(iterable, path),
                                  makePrimitiveExpression("next", path),
                                  path,
                                ),
                                makeReadCacheExpression(iterable, path),
                                [],
                                path,
                              ),
                              path,
                            ),
                            path,
                          ),
                        ]
                      : unbuildItem({ node, path, meta }, context, {
                          iterable,
                          step,
                          wrapEffect,
                          listFinalNode,
                        }),
                  ),
                  wrapEffect(
                    makeConditionalEffect(
                      makeGetExpression(
                        makeReadCacheExpression(step, path),
                        makePrimitiveExpression("done", path),
                        path,
                      ),
                      [],
                      [
                        makeConditionalEffect(
                          makeBinaryExpression(
                            "==",
                            makeGetExpression(
                              makeReadCacheExpression(iterable, path),
                              makePrimitiveExpression("return", path),
                              path,
                            ),
                            makePrimitiveExpression(null, path),
                            path,
                          ),
                          [],
                          [
                            makeExpressionEffect(
                              makeApplyExpression(
                                makeGetExpression(
                                  makeReadCacheExpression(iterable, path),
                                  makePrimitiveExpression("return", path),
                                  path,
                                ),
                                makeReadCacheExpression(iterable, path),
                                [],
                                path,
                              ),
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
                ],
              ),
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
      if (sites.properties.length === 0) {
        return [
          wrapEffect(
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                right,
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
            path,
          ),
        ];
      } else {
        if (every(sites.properties, isAssignmentPropertySite)) {
          // ts shenanigan: preserve type narrowing in callback
          const sites_properties = sites.properties;
          return listInitCacheNode(
            "constant",
            right,
            { path, meta: metas.right },
            wrapEffect,
            (right) =>
              flatMap(sites_properties, (site) =>
                unbuildProperty(site, context, {
                  right: makeReadCacheExpression(right, path),
                  wrapEffect,
                  listFinalNode,
                }),
              ),
          );
        } else {
          return listInitCacheNode(
            "constant",
            right,
            { path, meta: metas.right },
            wrapEffect,
            (right) =>
              unbuildPropertyRest(sites.properties, context, {
                keys: [],
                right,
                wrapEffect,
                listFinalNode,
              }),
          );
        }
      }
    }
    case "RestElement": {
      return [
        wrapEffect(
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
 * @type {WrapEffect<aran.Effect<unbuild.Atom>>}
 */
const wrapEffectIdentity = (node, _path) => node;

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildWritePatternEffect = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    wrapEffect: wrapEffectIdentity,
    listFinalNode: listScopeWriteEffect,
  });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.js").RootProgram,
 *     scope: import("../scope/index.mjs").Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listScopeWriteStatement = (context, variable, right, { path, meta }) =>
  map(listScopeWriteEffect(context, variable, right, { path, meta }), (node) =>
    makeEffectStatement(node, path),
  );

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildWritePatternStatement = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    wrapEffect: makeEffectStatement,
    listFinalNode: listScopeWriteStatement,
  });

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildInitializePatternStatement = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    wrapEffect: makeEffectStatement,
    listFinalNode: listScopeInitializeStatement,
  });
