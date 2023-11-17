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
  listScopeInitializeStatement,
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
import { listInitCacheNode, makeReadCacheExpression } from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { getPrivateKey } from "../query/index.mjs";
import {
  listNextIterableEffect,
  listReturnIterableEffect,
} from "../helper.mjs";

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
 * @template N
 * @typedef {(
 *   context: import("../context.d.ts").Context,
 *   makeBody: (
 *     context: import("../context.d.ts").Context,
 *   ) => aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => N[]} WrapStatement
 */

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     iterator: import("../cache.mjs").Cache,
 *     next: import("../cache.mjs").WritableCache,
 *     wrapEffect: WrapEffect<N>,
 *     wrapStatement: WrapStatement<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildItem = (
  { node, path, meta },
  context,
  { iterator, next, wrapEffect, wrapStatement, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      const metas = splitMeta(meta, ["drill", "rest"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return listInitCacheNode(
        "constant",
        makeArrayExpression([], path),
        { path, meta: metas.rest },
        wrapEffect,
        (rest) => [
          ...wrapStatement(
            context,
            (context) => [
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
                      listNextIterableEffect({ path }, { iterator, next }),
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
                                    makeReadCacheExpression(next, path),
                                    makePrimitiveExpression("done", path),
                                    path,
                                  ),
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                  makeGetExpression(
                                    makeReadCacheExpression(next, path),
                                    makePrimitiveExpression("value", path),
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
            path,
          ),
          ...unbuildPattern(sites.argument, context, {
            right: makeReadCacheExpression(rest, path),
            wrapEffect,
            wrapStatement,
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
        wrapEffect,
        wrapStatement,
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
 *     wrapStatement: WrapStatement<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path, meta },
  context,
  { right, wrapEffect, wrapStatement, listFinalNode },
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
    wrapStatement,
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
 *     wrapStatement: WrapStatement<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildPropertyRest = (
  sites,
  context,
  { keys, right, wrapEffect, wrapStatement, listFinalNode },
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
                wrapStatement,
                listFinalNode,
              }),
            ],
          ),
          ...unbuildPropertyRest(tail, context, {
            keys,
            right,
            wrapEffect,
            wrapStatement,
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
              wrapStatement,
              listFinalNode,
            }),
            ...unbuildPropertyRest(tail, context, {
              keys: [...keys, key],
              right,
              wrapEffect,
              wrapStatement,
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
 *     wrapStatement: WrapStatement<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path, meta },
  context,
  { right, wrapEffect, wrapStatement, listFinalNode },
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
              node.left.type === "Identifier" && isNameSite(sites.right)
                ? unbuildNameExpression(sites.right, context, {
                    name: makePrimitiveExpression(node.left.name, path),
                  })
                : unbuildExpression(sites.right, context, {}),
              makeReadCacheExpression(right, path),
              path,
            ),
            wrapEffect,
            wrapStatement,
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
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.iterable },
        wrapEffect,
        (iterable) =>
          listInitCacheNode(
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
            wrapEffect,
            (iterator) =>
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
                { path, meta: metas.next },
                wrapEffect,
                (next) => [
                  ...flatMap(sites.elements, ({ node, path, meta }) =>
                    node === null
                      ? map(
                          listNextIterableEffect({ path }, { iterator, next }),
                          (node) => wrapEffect(node, path),
                        )
                      : unbuildItem({ node, path, meta }, context, {
                          iterator,
                          next,
                          wrapEffect,
                          wrapStatement,
                          listFinalNode,
                        }),
                  ),
                  ...map(
                    listReturnIterableEffect({ path }, { iterator, next }),
                    (node) => wrapEffect(node, path),
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
      return listInitCacheNode(
        "constant",
        right,
        { path, meta: metas.right },
        wrapEffect,
        (right) => [
          wrapEffect(
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
            path,
          ),
          ...(every(sites.properties, isAssignmentPropertySite)
            ? flatMap(sites.properties, (site) =>
                unbuildProperty(site, context, {
                  right: makeReadCacheExpression(right, path),
                  wrapEffect,
                  wrapStatement,
                  listFinalNode,
                }),
              )
            : unbuildPropertyRest(sites.properties, context, {
                keys: [],
                right,
                wrapEffect,
                wrapStatement,
                listFinalNode,
              })),
        ],
      );
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
 * @type {WrapStatement<aran.Statement<unbuild.Atom>>}
 */
const wrapStatementIdentity = (context, makeBody, _path) => makeBody(context);

/**
 * @type {WrapStatement<aran.Effect<unbuild.Atom>>}
 */
const wrapStatementArrow = (context, makeBody, path) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeArrowExpression(
        false,
        false,
        makeScopeClosureBlock(
          context,
          { link: null, kinds: {} },
          (_context) =>
            makeClosureBlock(
              [],
              makeBody(_context),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
          path,
        ),
        path,
      ),
      makePrimitiveExpression({ undefined: null }, path),
      [],
      path,
    ),
    path,
  ),
];

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
    wrapStatement: wrapStatementArrow,
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
    wrapStatement: wrapStatementIdentity,
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
    wrapStatement: wrapStatementIdentity,
    listFinalNode: listScopeInitializeStatement,
  });
