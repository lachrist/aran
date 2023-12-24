/* eslint-disable no-use-before-define */

import {
  every,
  filterNarrow,
  flatMap,
  map,
  mapObject,
} from "../../util/index.mjs";
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
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isAssignmentPropertySite,
  isNameSite,
  isRestElementSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
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
  listenSequence,
  mapSequence,
  mapTwoSequence,
  sequenceClosureBlock,
  sequenceControlBlock,
  sequenceEffect,
  tellSequence,
} from "../sequence.mjs";
import { unbuildMemberKey, unbuildMemberObject } from "./member.mjs";

Array.from({
  [Symbol.iterator]: () => {},
});

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
      const metas = splitMeta(meta, ["drill", "rest", "wrap"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      
      return makeConditionalExpression(
        makeGetExpression(

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
                            ...scope,
                            closure: extendClosure(scope.closure, {
                              type: "arrow",
                            }),
                          },
                          {
                            frame: { situ: "local", link: null, kinds: {} },
                          },
                        ),
                        (scope) =>
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
                                    extendStaticScope({ path }, scope, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: {},
                                      },
                                    }),
                                    (_scope) =>
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
              ...unbuildPattern(sites.argument, scope, {
                operation,
                right: rest,
              }),
            ]),
        ),
      );
    }
    default: {
      const metas = splitMeta(meta, ["drill", "next"]);
      return sequenceEffect(
        mapSequence(
          cacheConstant(
            metas.next,
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
            unbuildPattern({ node, path, meta: metas.drill }, scope, {
              operation,
              right,
            }),
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
const unbuildProperty = (
  { node, path, meta },
  scope,
  { operation, object },
) => {
  const { computed } = node;
  const metas = splitMeta(meta, ["drill", "next"]);
  const sites = drill({ node, path, meta }, ["key", "value"]);
  return sequenceEffect(
    mapSequence(
      cacheConstant(
        metas.next,
        makeGetExpression(
          makeReadCacheExpression(object, path),
          unbuildKeyExpression(sites.key, scope, { convert: false, computed }),
          path,
        ),
        path,
      ),
      (right) =>
        unbuildPattern(sites.value, scope, {
          operation,
          right,
        }),
    ),
    path,
  );
};

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
) => {
  const { computed } = node;
  const metas = splitMeta(meta, ["drill", "key", "next"]);
  const sites = drill({ node, path, meta: metas.drill }, ["key", "value"]);
  return bindSequence(
    cacheConstant(
      metas.key,
      unbuildKeyExpression(sites.key, scope, {
        convert: true,
        computed,
      }),
      path,
    ),
    (key) =>
      bindSequence(
        cacheConstant(
          metas.next,
          makeGetExpression(
            makeReadCacheExpression(object, path),
            makeReadCacheExpression(key, path),
            path,
          ),
          path,
        ),
        (right) =>
          initSequence(
            unbuildPattern(sites.value, scope, {
              operation,
              right,
            }),
            key,
          ),
      ),
  );
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.RestElement
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operation: "write" | "initialize",
 *     object: import("../cache.d.ts").Cache,
 *     keys: import("../cache.d.ts").Cache[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  { node, path, meta },
  scope,
  { operation, object, keys },
) => {
  const metas = splitMeta(meta, ["drill", "rest"]);
  const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
  return sequenceEffect(
    mapSequence(
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
        ...unbuildPattern(sites.argument, scope, {
          operation,
          right: rest,
        }),
      ],
    ),
    path,
  );
};

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
const unbuildPattern = ({ node, path, meta }, scope, { right, operation }) => {
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
      const { computed } = node;
      const metas = splitMeta(meta, ["drill", "set"]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "object",
        "property",
      ]);
      return sequenceEffect(
        mapTwoSequence(
          unbuildMemberObject(sites.object, scope, {}),
          unbuildMemberKey(sites.property, scope, { computed }),
          (object, key) =>
            listSetMemberEffect({ path, meta: metas.set }, scope, {
              object,
              key,
              value: right,
            }),
        ),
        path,
      );
    }
    case "AssignmentPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      return sequenceEffect(
        mapSequence(
          cacheConstant(
            metas.right,
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              node.left.type === "Identifier" && isNameSite(sites.right)
                ? unbuildNameExpression(sites.right, scope, {
                    name: makePrimitiveExpression(node.left.name, path),
                  })
                : unbuildExpression(sites.right, scope, {}),
              makeReadCacheExpression(right, path),
              path,
            ),
            path,
          ),
          (right) => unbuildPattern(sites.left, scope, { right, operation }),
        ),
        path,
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
      return sequenceEffect(
        bindSequence(
          cacheConstant(
            metas.iterator,
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
                metas.next,
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
                  (step) => [
                    ...flatMap(sites.elements, ({ node, path, meta }) =>
                      node === null
                        ? listNextIteratorEffect(
                            { path },
                            { asynchronous: false, iterator, next, step },
                          )
                        : unbuildItem({ node, path, meta }, scope, {
                            iterator,
                            next,
                            step,
                            operation,
                          }),
                    ),
                    ...listReturnIteratorEffect({ path }, { iterator, step }),
                  ],
                ),
            ),
        ),
        path,
      );
    }
    case "ObjectPattern": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["properties"]),
        "properties",
        drillArray,
      );
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
        ...(every(sites.properties, isAssignmentPropertySite)
          ? flatMap(sites.properties, (site) =>
              unbuildProperty(site, scope, {
                operation,
                object: right,
              }),
            )
          : sequenceEffect(
              mapSequence(
                flatSequence(
                  map(
                    filterNarrow(sites.properties, isAssignmentPropertySite),
                    (site) =>
                      unbuildRestProperty(site, scope, {
                        operation,
                        object: right,
                      }),
                  ),
                ),
                (keys) =>
                  flatMap(
                    filterNarrow(sites.properties, isRestElementSite),
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
 *     right: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildWritePatternEffect = (site, scope, { right }) =>
  unbuildPattern(site, scope, {
    operation: "write",
    right,
  });

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildInitializePatternEffect = (site, scope, { right }) =>
  unbuildPattern(site, scope, {
    operation: "initialize",
    right,
  });
