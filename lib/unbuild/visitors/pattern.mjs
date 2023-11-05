/* eslint-disable no-use-before-define */

import {
  AranTypeError,
  filter,
  filterOut,
  flat,
  flatMap,
  map,
  unzip,
  zip,
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
import {
  enumMeta,
  forkMeta,
  mangleMetaVariable,
  nextMeta,
  splitMeta,
} from "../mangle.mjs";
import {
  listScopeInitializeStatement,
  listScopeSetSuperEffect,
  listScopeWriteEffect,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { listCacheNode } from "../cache.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/pattern.mjs");

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
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
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
 *     meta: unbuild.RootMeta,
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
      return listCacheNode(
        iterator,
        path,
        mangleMetaVariable(meta),
        wrapNode,
        (iterator) =>
          unbuildPattern({ node, path }, context, {
            meta: forkMeta(meta),
            right: makeGetExpression(
              makeApplyExpression(
                makeGetExpression(
                  iterator,
                  makePrimitiveExpression("next", path),
                  path,
                ),
                iterator,
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
 *     meta: unbuild.RootMeta,
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
) =>
  unbuildPattern(drill({ node, path }, "value"), context, {
    meta: forkMeta(meta),
    right: makeGetExpression(
      right,
      unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta: forkMeta(nextMeta(meta)),
        computed: node.computed,
      }),
      path,
    ),
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
 *     meta: unbuild.RootMeta,
 *     right: aran.Expression<unbuild.Atom>,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => [unbuild.Variable, N[]]}
 */
const unbuildPropertySaveKey = (
  { node, path },
  context,
  { meta, right, wrapNode, listFinalNode },
) => [
  mangleMetaVariable(meta),
  [
    wrapNode(
      makeWriteEffect(
        mangleMetaVariable(meta),
        unbuildKeyExpression(drill({ node, path }, "key"), context, {
          meta: forkMeta(meta),
          computed: node.computed,
        }),
        true,
        path,
      ),
      path,
    ),
    ...unbuildPattern(drill({ node, path }, "value"), context, {
      meta: forkMeta(nextMeta(meta)),
      right: makeGetExpression(
        right,
        makeReadExpression(mangleMetaVariable(meta), path),
        path,
      ),
      wrapNode,
      listFinalNode,
    }),
  ],
];

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.RestElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *     right: aran.Expression<unbuild.Atom>,
 *     keys: unbuild.Variable[],
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>
 *   },
 * ) => N[]}
 */
const unbuildRest = (
  { node, path },
  context,
  { meta, right, keys, wrapNode, listFinalNode },
) =>
  listCacheNode(
    makeApplyExpression(
      makeIntrinsicExpression("Object.assign", path),
      makePrimitiveExpression({ undefined: null }, path),
      [right],
      path,
    ),
    path,
    mangleMetaVariable(meta),
    wrapNode,
    (rest) => [
      ...map(keys, (key) =>
        wrapNode(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.deleteProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [rest, makeReadExpression(key, path)],
              path,
            ),
            path,
          ),
          path,
        ),
      ),
      ...unbuildPattern(drill({ node, path }, "argument"), context, {
        meta: forkMeta(meta),
        right: rest,
        wrapNode,
        listFinalNode,
      }),
    ],
  );

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
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
                  meta: forkMeta(metas.object),
                  name: ANONYMOUS,
                }),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    meta: forkMeta(metas.key),
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
      const metas = splitMeta(meta, ["left", "right"]);
      return listCacheNode(
        right,
        path,
        mangleMetaVariable(meta),
        wrapNode,
        (right) =>
          unbuildPattern(drill({ node, path }, "left"), context, {
            meta: forkMeta(metas.left),
            right: makeConditionalExpression(
              makeBinaryExpression(
                "===",
                right,
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                meta: forkMeta(metas.right),
                name: ANONYMOUS,
              }),
              right,
              path,
            ),
            wrapNode,
            listFinalNode,
          }),
      );
    }
    case "ArrayPattern": {
      const metas = splitMeta(meta, ["right", "iterator", "elements"]);
      return listCacheNode(
        right,
        path,
        mangleMetaVariable(metas.right),
        wrapNode,
        (right) =>
          listCacheNode(
            makeApplyExpression(
              makeGetExpression(
                right,
                makeIntrinsicExpression("Symbol.iterator", path),
                path,
              ),
              right,
              [],
              path,
            ),
            path,
            mangleMetaVariable(metas.iterator),
            wrapNode,
            (iterator) => [
              ...flatMap(
                zip(
                  enumMeta(forkMeta(metas.elements), node.elements.length),
                  drillAll(drillArray({ node, path }, "elements")),
                ),
                ([meta, { node, path }]) =>
                  node === null
                    ? [
                        wrapNode(
                          makeExpressionEffect(
                            makeApplyExpression(
                              makeGetExpression(
                                iterator,
                                makePrimitiveExpression("next", path),
                                path,
                              ),
                              iterator,
                              [],
                              path,
                            ),
                            path,
                          ),
                          path,
                        ),
                      ]
                    : unbuildItem({ node, path }, context, {
                        meta: forkMeta(meta),
                        iterator,
                        wrapNode,
                        listFinalNode,
                      }),
              ),
            ],
          ),
      );
    }
    case "ObjectPattern": {
      const { init, tail } = extractRest(
        drillAll(drillArray({ node, path }, "properties")),
      );
      if (tail.length === 0) {
        return listCacheNode(
          right,
          path,
          mangleMetaVariable(meta),
          wrapNode,
          (right) =>
            flatMap(zip(enumMeta(meta, init.length), init), ([meta, pair]) =>
              unbuildProperty(pair, context, {
                meta: forkMeta(meta),
                right,
                wrapNode,
                listFinalNode,
              }),
            ),
        );
      } else if (tail.length === 1) {
        const metas = splitMeta(meta, ["right", "init", "rest"]);
        return listCacheNode(
          right,
          path,
          mangleMetaVariable(metas.right),
          wrapNode,
          (right) => {
            const [head, body] = unzip(
              map(
                zip(enumMeta(forkMeta(metas.init), init.length), init),
                ([meta, pair]) =>
                  unbuildPropertySaveKey(pair, context, {
                    meta: forkMeta(meta),
                    right,
                    wrapNode,
                    listFinalNode,
                  }),
              ),
            );
            return [
              ...flat(body),
              ...unbuildRest(tail[0], context, {
                meta: forkMeta(metas.rest),
                right,
                keys: head,
                wrapNode,
                listFinalNode,
              }),
            ];
          },
        );
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
 *     meta: unbuild.RootMeta,
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
 *     meta: unbuild.RootMeta,
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
