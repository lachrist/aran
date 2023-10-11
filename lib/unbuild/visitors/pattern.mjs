/* eslint-disable no-use-before-define */
import {
  StaticError,
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
import { SyntaxAranError } from "../../error.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";

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
 *   right: aran.Parameter | unbuild.Variable,
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
      const rest = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("rest_array"),
        path,
      );
      return [
        wrapNode(
          makeWriteEffect(
            rest,
            makeApplyExpression(
              makeIntrinsicExpression("Array.from", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadExpression(iterator, path)],
              path,
            ),
            true,
            path,
          ),
          path,
        ),
        ...unbuildPattern(drill({ node, path }, "argument"), context, {
          right: rest,
          wrapNode,
          listFinalNode,
        }),
      ];
    }
    default: {
      const item = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("item"),
        path,
      );
      return [
        wrapNode(
          makeWriteEffect(
            item,
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
            true,
            path,
          ),
          path,
        ),
        ...unbuildPattern({ node, path }, context, {
          right: item,
          wrapNode,
          listFinalNode,
        }),
      ];
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
 *     right: aran.Parameter | unbuild.Variable,
 *     wrapNode: WrapNode<N>,
 *     listFinalNode: ListFinalNode<N>,
 *   },
 * ) => N[]}
 */
const unbuildProperty = (
  { node, path },
  context,
  { right, wrapNode, listFinalNode },
) => {
  const property = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("property"),
    path,
  );
  return [
    wrapNode(
      makeWriteEffect(
        property,
        makeGetExpression(
          makeReadExpression(right, path),
          unbuildKeyExpression(drill({ node, path }, "key"), context, node),
          path,
        ),
        true,
        path,
      ),
      path,
    ),
    ...unbuildPattern(drill({ node, path }, "value"), context, {
      right: property,
      wrapNode,
      listFinalNode,
    }),
  ];
};

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   pair: {
 *     node: estree.AssignmentProperty,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: aran.Parameter | unbuild.Variable,
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
  const value = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("value"),
    path,
  );
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
      wrapNode(
        makeWriteEffect(
          value,
          makeGetExpression(
            makeReadExpression(right, path),
            makeReadExpression(key, path),
            path,
          ),
          true,
          path,
        ),
        path,
      ),
      ...unbuildPattern(drill({ node, path }, "value"), context, {
        right: value,
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
 *     right: unbuild.Variable | aran.Parameter,
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
          [makeReadExpression(right, path)],
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
      right: rest,
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
 *     right: aran.Parameter | unbuild.Variable,
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
    case "Identifier":
      return listFinalNode(
        context,
        /** @type {estree.Variable} */ (node.name),
        right,
        path,
      );
    case "MemberExpression":
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
                makeReadExpression(right, path),
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
                context,
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
                makeReadExpression(right, path),
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      }
    case "AssignmentPattern": {
      const assignment = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("assignment"),
        path,
      );
      return [
        wrapNode(
          makeWriteEffect(
            assignment,
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(right, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              makeReadExpression(right, path),
              path,
            ),
            true,
            path,
          ),
          path,
        ),
        ...unbuildPattern(drill({ node, path }, "left"), context, {
          right: assignment,
          wrapNode,
          listFinalNode,
        }),
      ];
    }
    case "ArrayPattern": {
      const iterator = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("iterator"),
        path,
      );
      return [
        wrapNode(
          makeWriteEffect(
            iterator,
            makeApplyExpression(
              makeGetExpression(
                makeReadExpression(right, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                path,
              ),
              makeReadExpression(right, path),
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
      ];
    }
    case "ObjectPattern": {
      const { init, tail } = extractRest(
        drillAll(drillArray({ node, path }, "properties")),
      );
      if (tail.length === 0) {
        return flatMap(init, ({ node, path }) =>
          unbuildProperty({ node, path }, context, {
            right,
            wrapNode,
            listFinalNode,
          }),
        );
      } else if (tail.length === 1) {
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
      } else {
        throw new SyntaxAranError("multiple rest parameters", node);
      }
    }
    case "RestElement":
      throw new SyntaxAranError("illegal rest element", node);
    default:
      throw new StaticError(BASENAME, node);
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
 *     right: aran.Parameter | unbuild.Variable,
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
 *     right: aran.Parameter | unbuild.Variable,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildPatternStatement = ({ node, path }, context, { right }) =>
  unbuildPattern({ node, path }, context, {
    right,
    wrapNode: makeEffectStatement,
    listFinalNode: listScopeInitializeStatement,
  });
