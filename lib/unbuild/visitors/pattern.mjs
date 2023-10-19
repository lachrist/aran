/* eslint-disable no-use-before-define */

import {
  AranTypeError,
  filter,
  filterOut,
  flat,
  flatMap,
  map,
  unzip,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  listScopeInitializeStatement,
  listScopeWriteEffect,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { makeSetSuperExpression } from "../record.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import {
  listCacheSaveNode,
  makeLoadCacheExpression,
  makeTakeCacheExpression,
} from "../cache.mjs";

const BASENAME = /** @type {__basename} */ ("pattern");

/** @type {(pair: {node: estree.Node}) => boolean} */
const isRestElement = ({ node: { type } }) => type === "RestElement";

/**
 * @template N
 * @typedef {(
 *   context: {
 *     strict: boolean,
 *     scope: import("../scope/index.mjs").Scope,
 *   },
 *   variable: estree.Variable,
 *   right: import("../cache.mjs").Cache,
 *   path: unbuild.Path,
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
 * @type {<X extends estree.Node>(
 *   pairs: {
 *     node: (X | estree.RestElement),
 *     path: unbuild.Path,
 *   }[],
 * ) => {
 *   init: {
 *     node: X,
 *     path: unbuild.Path,
 *   }[],
 *   tail: {
 *     node: estree.RestElement,
 *     path: unbuild.Path,
 *   }[],
 * }}
 */
const extractRest = (pairs) => ({
  init: /** @type {any} */ (filterOut(pairs, isRestElement)),
  tail: /** @type {any} */ (filter(pairs, isRestElement)),
});

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     iterator: aran.Parameter | unbuild.Variable,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildItem = (
  { node, path },
  context,
  { iterator, wrapNode, listFinalNode },
) => {
  switch (node.type) {
    case "RestElement": {
      return unbuildPattern(drill({ node, path }, "argument"), context, {
        right: {
          var: mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("rest_array"),
            path,
          ),
          val: makeApplyExpression(
            makeIntrinsicExpression("Array.from", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadExpression(iterator, path)],
            path,
          ),
        },
        wrapNode,
        listFinalNode,
      });
    }
    default: {
      return unbuildPattern({ node, path }, context, {
        right: {
          var: mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("item"),
            path,
          ),
          val: makeApplyExpression(
            makeGetExpression(
              makeReadExpression(iterator, path),
              makePrimitiveExpression("next", path),
              path,
            ),
            makeReadExpression(iterator, path),
            [],
            path,
          ),
        },
        wrapNode,
        listFinalNode,
      });
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
 *     right: import("../cache.mjs").Cache,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path },
  context,
  { right, wrapNode, listFinalNode },
) =>
  unbuildPattern(drill({ node, path }, "value"), context, {
    right: {
      var: mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("property"),
        path,
      ),
      val: makeGetExpression(
        makeTakeCacheExpression(right, path),
        unbuildKeyExpression(drill({ node, path }, "key"), context, node),
        path,
      ),
    },
    wrapNode,
    listFinalNode,
  });

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.AssignmentProperty,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: import("../cache.mjs").Cache,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => [unbuild.Variable, N[]]}
 */
const unbuildPropertySaveKey = (
  { node, path },
  context,
  { right, wrapNode, listFinalNode },
) => {
  const key = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("key"),
    path,
  );
  return [
    key,
    [
      wrapNode(
        makeWriteEffect(
          key,
          unbuildKeyExpression(drill({ node, path }, "key"), context, node),
          true,
          path,
        ),
        path,
      ),
      ...unbuildPattern(drill({ node, path }, "value"), context, {
        right: {
          var: mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("value"),
            path,
          ),
          val: makeGetExpression(
            makeTakeCacheExpression(right, path),
            makeReadExpression(key, path),
            path,
          ),
        },
        wrapNode,
        listFinalNode,
      }),
    ],
  ];
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.RestElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: import("../cache.mjs").Cache,
 *     keys: unbuild.Variable[],
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildRest = (
  { node, path },
  context,
  { right, keys, wrapNode, listFinalNode },
) => {
  const rest = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("rest_object"),
    path,
  );
  return [
    wrapNode(
      makeWriteEffect(
        rest,
        makeApplyExpression(
          makeIntrinsicExpression("Object.assign", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeTakeCacheExpression(right, path)],
          path,
        ),
        true,
        path,
      ),
      path,
    ),
    ...map(keys, (key) =>
      wrapNode(
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.deleteProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadExpression(rest, path), makeReadExpression(key, path)],
            path,
          ),
          path,
        ),
        path,
      ),
    ),
    ...unbuildPattern(drill({ node, path }, "argument"), context, {
      right: {
        var: null,
        val: makeReadExpression(rest, path),
      },
      wrapNode,
      listFinalNode,
    }),
  ];
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     right: import("../cache.mjs").Cache,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path },
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
      );
    }
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                unbuildExpression(drill({ node, path }, "object"), context, {
                  name: ANONYMOUS,
                }),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
                makeTakeCacheExpression(right, path),
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      } else {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetSuperExpression(
                context.strict,
                context.record,
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
                makeTakeCacheExpression(right, path),
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      }
    }
    case "AssignmentPattern": {
      return listCacheSaveNode(right, path, wrapNode, (right) =>
        unbuildPattern(drill({ node, path }, "left"), context, {
          right: {
            var: mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("assignment"),
              path,
            ),
            val: makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeLoadCacheExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              makeLoadCacheExpression(right, path),
              path,
            ),
          },
          wrapNode,
          listFinalNode,
        }),
      );
    }
    case "ArrayPattern": {
      const iterator = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("iterator"),
        path,
      );
      return listCacheSaveNode(right, path, wrapNode, (right) => [
        wrapNode(
          makeWriteEffect(
            iterator,
            makeApplyExpression(
              makeGetExpression(
                makeLoadCacheExpression(right, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                path,
              ),
              makeLoadCacheExpression(right, path),
              [],
              path,
            ),
            true,
            path,
          ),
          path,
        ),
        ...flatMap(
          drillAll(drillArray({ node, path }, "elements")),
          ({ node, path }) =>
            node === null
              ? [
                  wrapNode(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeGetExpression(
                          makeReadExpression(iterator, path),
                          makePrimitiveExpression("next", path),
                          path,
                        ),
                        makeReadExpression(iterator, path),
                        [],
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                ]
              : unbuildItem({ node, path }, context, {
                  iterator,
                  wrapNode,
                  listFinalNode,
                }),
        ),
      ]);
    }
    case "ObjectPattern": {
      const { init, tail } = extractRest(
        drillAll(drillArray({ node, path }, "properties")),
      );
      if (tail.length === 0) {
        return listCacheSaveNode(right, path, wrapNode, (right) =>
          flatMap(init, ({ node, path }) =>
            unbuildProperty({ node, path }, context, {
              right,
              wrapNode,
              listFinalNode,
            }),
          ),
        );
      } else if (tail.length === 1) {
        return listCacheSaveNode(right, path, wrapNode, (right) => {
          const [head, body] = unzip(
            map(init, ({ node, path }) =>
              unbuildPropertySaveKey({ node, path }, context, {
                right,
                wrapNode,
                listFinalNode,
              }),
            ),
          );
          return [
            ...flat(body),
            ...unbuildRest(tail[0], context, {
              right,
              keys: head,
              wrapNode,
              listFinalNode,
            }),
          ];
        });
      } else {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSyntaxErrorExpression("Multiple rest elements", path),
              path,
            ),
            path,
          ),
        ];
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
      throw new AranTypeError(BASENAME, node);
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
 *     right: import("../cache.mjs").Cache,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildPatternEffect = ({ node, path }, context, { right }) =>
  unbuildPattern({ node, path }, context, {
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
 *     right: import("../cache.mjs").Cache,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildPatternStatement = ({ node, path }, context, { right }) =>
  unbuildPattern({ node, path }, context, {
    right,
    wrapNode: makeEffectStatement,
    listFinalNode: listScopeInitializeStatement,
  });
