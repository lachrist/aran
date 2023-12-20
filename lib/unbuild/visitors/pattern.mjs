/* eslint-disable no-use-before-define */

import { every, flatMap, map, mapObject } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeApplyExpression,
  makeArrowExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeWhileStatement,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  extendStaticScope,
  listScopeInitializeEffect,
  listScopeWriteEffect,
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
import {
  cacheConstant,
  cacheWritable,
  makeReadCacheExpression,
} from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { getPrivateKey } from "../query/index.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
} from "../helper.mjs";
import {
  bindSequence,
  initSequence,
  listenSequence,
  sequenceClosureBlock,
  sequenceControlBlock,
  tellSequence,
} from "../sequence.mjs";
import { extendClosure } from "../param/index.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     iterator: import("../cache.d.ts").Cache,
 *     next: import("../cache.d.ts").Cache,
 *     step: import("../cache.d.ts").WritableCache,
 *     listFinalNode: import("./pattern.d.ts").ListFinalNode,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildItem = (
  { node, path, meta },
  context,
  { iterator, next, step, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      const metas = splitMeta(meta, ["drill", "rest", "wrap"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return listenSequence(
        bindSequence(
          cacheConstant(metas.rest, makeArrayExpression([], path), path),
          (rest) =>
            tellSequence([
              makeExpressionEffect(
                makeApplyExpression(
                  // no await|yield here
                  makeArrowExpression(
                    false,
                    false,
                    sequenceClosureBlock(
                      bindSequence(
                        extendStaticScope(
                          { path },
                          {
                            ...context,
                            closure: extendClosure(context.closure, {
                              type: "arrow",
                            }),
                          },
                          {
                            frame: { situ: "local", link: null, kinds: {} },
                          },
                        ),
                        (context) =>
                          initSequence(
                            [
                              makeWhileStatement(
                                makeUnaryExpression(
                                  "!",
                                  makeGetExpression(
                                    makeReadCacheExpression(step, path),
                                    makePrimitiveExpression("done", path),
                                    path,
                                  ),
                                  path,
                                ),
                                sequenceControlBlock(
                                  bindSequence(
                                    extendStaticScope({ path }, context, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: {},
                                      },
                                    }),
                                    (_context) =>
                                      tellSequence([
                                        ...map(
                                          listNextIteratorEffect(
                                            { path },
                                            {
                                              asynchronous: false,
                                              iterator,
                                              next,
                                              step,
                                            },
                                          ),
                                          (node) =>
                                            makeEffectStatement(node, path),
                                        ),
                                        makeEffectStatement(
                                          makeConditionalEffect(
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                step,
                                                path,
                                              ),
                                              makePrimitiveExpression(
                                                "done",
                                                path,
                                              ),
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
                                                  makeReadCacheExpression(
                                                    rest,
                                                    path,
                                                  ),
                                                  [
                                                    makeConditionalExpression(
                                                      makeGetExpression(
                                                        makeReadCacheExpression(
                                                          step,
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
                                                          step,
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
                                      ]),
                                  ),
                                  [],
                                  path,
                                ),
                                path,
                              ),
                            ],
                            makePrimitiveExpression({ undefined: null }, path),
                          ),
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
              ...unbuildPattern(sites.argument, context, {
                right: makeReadCacheExpression(rest, path),
                listFinalNode,
              }),
            ]),
        ),
      );
    }
    default: {
      return unbuildPattern({ node, path, meta }, context, {
        right: makeSequenceExpression(
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
        listFinalNode,
      });
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.AssignmentProperty>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     listFinalNode: import("./pattern.d.ts").ListFinalNode,
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
 *   sites: import("../site.d.ts").Site<
 *     estree.AssignmentProperty | estree.RestElement,
 *   >[],
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: import("../cache.d.ts").ConstantCache[],
 *     right: import("../cache.d.ts").ConstantCache,
 *     listFinalNode: import("./pattern.d.ts").ListFinalNode,
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
          ...listenSequence(
            bindSequence(
              cacheConstant(
                metas.rest,
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
                path,
              ),
              (rest) =>
                tellSequence([
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
                ]),
            ),
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
        return listenSequence(
          bindSequence(
            cacheConstant(
              metas.key,
              unbuildKeyExpression(sites.key, context, {
                convert: true,
                computed,
              }),
              path,
            ),
            (key) =>
              tellSequence([
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
              ]),
          ),
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
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *     listFinalNode: import("./pattern.d.ts").ListFinalNode,
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
      return listFinalNode({ path, meta }, context, {
        variable: /** @type {estree.Variable} */ (node.name),
        right,
      });
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
      return listenSequence(
        bindSequence(cacheConstant(metas.right, right, path), (right) =>
          tellSequence(
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
          ),
        ),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, [
        "drill",
        "iterable",
        "iterator",
        "next",
        "step",
      ]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["elements"]),
        "elements",
        drillArray,
      );
      return listenSequence(
        bindSequence(cacheConstant(metas.iterable, right, path), (iterable) =>
          bindSequence(
            cacheConstant(
              metas.iterator,
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
              path,
            ),
            (iterator) =>
              bindSequence(
                cacheConstant(
                  metas.next,
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
                      metas.step,
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
                    (step) =>
                      tellSequence([
                        ...flatMap(sites.elements, ({ node, path, meta }) =>
                          node === null
                            ? listNextIteratorEffect(
                                { path },
                                { asynchronous: false, iterator, next, step },
                              )
                            : unbuildItem({ node, path, meta }, context, {
                                iterator,
                                next,
                                step,
                                listFinalNode,
                              }),
                        ),
                        ...listReturnIteratorEffect(
                          { path },
                          { iterator, step },
                        ),
                      ]),
                  ),
              ),
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
      return listenSequence(
        bindSequence(cacheConstant(metas.right, right, path), (right) =>
          tellSequence([
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
          ]),
        ),
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
      throw new AranTypeError("invalid pattern node", node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildWritePatternEffect = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    listFinalNode: listScopeWriteEffect,
  });

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildInitializePatternEffect = (site, context, { right }) =>
  unbuildPattern(site, context, {
    right,
    listFinalNode: listScopeInitializeEffect,
  });
