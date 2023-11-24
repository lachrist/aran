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
  makeWhileStatement,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listScopeInitializeEffect,
  listScopeWriteEffect,
  makeScopeClosureBlock,
  makeScopeControlBlock,
} from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isAssignmentPropertySite,
  isNameSite,
  isNotSuperSite,
  isPrivateIdentifierSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { listInitCacheEffect, makeReadCacheExpression } from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { getPrivateKey } from "../query/index.mjs";
import {
  listNextIterableEffect,
  listReturnIterableEffect,
} from "../helper.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/pattern.mjs");

/**
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
 * ) => aran.Effect<unbuild.Atom>[]} ListFinalNode
 */

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     iterator: import("../cache.mjs").Cache,
 *     next: import("../cache.mjs").WritableCache,
 *     listFinalNode: ListFinalNode,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildItem = (
  { node, path, meta },
  context,
  { iterator, next, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      const metas = splitMeta(meta, ["drill", "rest", "wrap"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return listInitCacheEffect(
        "constant",
        makeArrayExpression([], path),
        { path, meta: metas.rest },
        (rest) => [
          makeExpressionEffect(
            makeApplyExpression(
              // no await|yield here
              makeArrowExpression(
                false,
                false,
                makeScopeClosureBlock({ path, meta: metas.wrap }, context, {
                  frame: { link: null, kinds: {} },
                  makeBody: (context) =>
                    makeClosureBlock(
                      [],
                      [
                        makeWhileStatement(
                          makeUnaryExpression(
                            "!",
                            makeGetExpression(
                              makeReadCacheExpression(next, path),
                              makePrimitiveExpression("done", path),
                              path,
                            ),
                            path,
                          ),
                          makeScopeControlBlock(
                            context,
                            { link: null, kinds: {} },
                            [],
                            (_context) => [
                              ...map(
                                listNextIterableEffect(
                                  { path },
                                  { iterator, next },
                                ),
                                (node) => makeEffectStatement(node, path),
                              ),
                              makeEffectStatement(
                                makeConditionalEffect(
                                  makeGetExpression(
                                    makeReadCacheExpression(next, path),
                                    makePrimitiveExpression("done", path),
                                    path,
                                  ),
                                  [],
                                  [
                                    makeExpressionEffect(
                                      makeApplyExpression(
                                        makeIntrinsicExpression(
                                          "Array.prototype.push",
                                          path,
                                        ),
                                        makeReadCacheExpression(rest, path),
                                        [
                                          makeConditionalExpression(
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                next,
                                                path,
                                              ),
                                              makePrimitiveExpression(
                                                "done",
                                                path,
                                              ),
                                              path,
                                            ),
                                            makePrimitiveExpression(
                                              { undefined: null },
                                              path,
                                            ),
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                next,
                                                path,
                                              ),
                                              makePrimitiveExpression(
                                                "value",
                                                path,
                                              ),
                                              path,
                                            ),
                                            path,
                                          ),
                                        ],
                                        path,
                                      ),
                                      path,
                                    ),
                                  ],
                                  path,
                                ),
                                path,
                              ),
                            ],
                            path,
                          ),
                          path,
                        ),
                      ],
                      makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                }),
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              [],
              path,
            ),
            path,
          ),
          ...unbuildPattern(sites.argument, context, {
            right: makeReadCacheExpression(rest, path),
            listFinalNode,
          }),
        ],
      );
    }
    default: {
      return unbuildPattern({ node, path, meta }, context, {
        right: makeLongSequenceExpression(
          listNextIterableEffect({ path }, { iterator, next }),
          makeConditionalExpression(
            makeGetExpression(
              makeReadCacheExpression(next, path),
              makePrimitiveExpression("done", path),
              path,
            ),
            makePrimitiveExpression({ undefined: null }, path),
            makeGetExpression(
              makeReadCacheExpression(next, path),
              makePrimitiveExpression("value", path),
              path,
            ),
            path,
          ),
          path,
        ),
        listFinalNode,
      });
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.AssignmentProperty>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     listFinalNode: ListFinalNode,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildProperty = (
  { node, path, meta },
  context,
  { right, listFinalNode },
) => {
  const { computed } = node;
  const sites = drill({ node, path, meta }, ["key", "value"]);
  return unbuildPattern(sites.value, context, {
    right: makeGetExpression(
      right,
      unbuildKeyExpression(sites.key, context, { convert: false, computed }),
      path,
    ),
    listFinalNode,
  });
};

/**
 * @type {(
 *   sites: import("../site.mjs").Site<
 *     estree.AssignmentProperty | estree.RestElement,
 *   >[],
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     keys: import("../cache.mjs").ConstantCache[],
 *     right: import("../cache.mjs").ConstantCache,
 *     listFinalNode: ListFinalNode,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildPropertyRest = (
  sites,
  context,
  { keys, right, listFinalNode },
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
          ...listInitCacheEffect(
            "constant",
            makeApplyExpression(
              makeIntrinsicExpression("Object.assign", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeObjectExpression(
                  makeIntrinsicExpression("Object.prototype", path),
                  [],
                  path,
                ),
                makeReadCacheExpression(right, path),
              ],
              path,
            ),
            { path, meta: metas.rest },
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
              ...unbuildPattern(sites.argument, context, {
                right: makeReadCacheExpression(rest, path),
                listFinalNode,
              }),
            ],
          ),
          ...unbuildPropertyRest(tail, context, {
            keys,
            right,
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
        return listInitCacheEffect(
          "constant",
          unbuildKeyExpression(sites.key, context, { convert: true, computed }),
          { path, meta: metas.key },
          (key) => [
            ...unbuildPattern(sites.value, context, {
              right: makeGetExpression(
                makeReadCacheExpression(right, path),
                makeReadCacheExpression(key, path),
                path,
              ),
              listFinalNode,
            }),
            ...unbuildPropertyRest(tail, context, {
              keys: [...keys, key],
              right,
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
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     listFinalNode: ListFinalNode,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildPattern = (
  { node, path, meta },
  context,
  { right, listFinalNode },
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
      return listSetMemberEffect(
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
      );
    }
    case "AssignmentPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.right },
        (right) =>
          unbuildPattern(sites.left, context, {
            right: makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              node.left.type === "Identifier" && isNameSite(sites.right)
                ? unbuildNameExpression(sites.right, context, {
                    name: makePrimitiveExpression(node.left.name, path),
                  })
                : unbuildExpression(sites.right, context, {}),
              makeReadCacheExpression(right, path),
              path,
            ),
            listFinalNode,
          }),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, [
        "drill",
        "iterable",
        "iterator",
        "next",
        "proper",
      ]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["elements"]),
        "elements",
        drillArray,
      );
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.iterable },
        (iterable) =>
          listInitCacheEffect(
            "constant",
            makeApplyExpression(
              makeGetExpression(
                makeReadCacheExpression(iterable, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                path,
              ),
              makeReadCacheExpression(iterable, path),
              [],
              path,
            ),
            { path, meta: metas.iterator },
            (iterator) =>
              listInitCacheEffect(
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
                { path, meta: metas.next },
                (next) => [
                  ...flatMap(sites.elements, ({ node, path, meta }) =>
                    node === null
                      ? listNextIterableEffect({ path }, { iterator, next })
                      : unbuildItem({ node, path, meta }, context, {
                          iterator,
                          next,
                          listFinalNode,
                        }),
                  ),
                  ...listReturnIterableEffect({ path }, { iterator, next }),
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
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.right },
        (right) => [
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
          ...(every(sites.properties, isAssignmentPropertySite)
            ? flatMap(sites.properties, (site) =>
                unbuildProperty(site, context, {
                  right: makeReadCacheExpression(right, path),
                  listFinalNode,
                }),
              )
            : unbuildPropertyRest(sites.properties, context, {
                keys: [],
                right,
                listFinalNode,
              })),
        ],
      );
    }
    case "RestElement": {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal rest element", path),
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
    listFinalNode: listScopeWriteEffect,
  });

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildInitializePatternEffect = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    listFinalNode: listScopeInitializeEffect,
  });
