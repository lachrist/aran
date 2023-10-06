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

const BASENAME = /** @basename */ "pattern";

/** @type {(pair: {node: estree.Node}) => boolean} */
const isRestElement = ({ node: { type } }) => type === "RestElement";

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
 * @type {<S, N extends aran.Node<unbuild.Atom<S>>>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   right: aran.Parameter | unbuild.Variable,
 *   wrapNode: (effect: aran.Effect<unbuild.Atom<S>>, serial: S) => N,
 *   listFinalNode: (
 *     context: {
 *       strict: boolean,
 *       scope: import("../scope/index.mjs").Scope,
 *     },
 *     variable: estree.Variable,
 *     right: aran.Parameter | unbuild.Variable,
 *     serial: S,
 *   ) => N[],
 * ) => N[]}
 */
const unbuildPattern = (
  { node, path },
  context,
  right,
  wrapNode,
  listFinalNode,
) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
  switch (node.type) {
    case "Identifier":
      return listFinalNode(
        context,
        /** @type {estree.Variable} */ (node.name),
        right,
        serial,
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
                makeReadExpression(right, serial),
                serial,
              ),
              serial,
            ),
            serial,
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
                makeReadExpression(right, serial),
                { serial, origin: node },
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "AssignmentPattern": {
      const assignment = mangleMetaVariable(hash, BASENAME, "assignment");
      return [
        wrapNode(
          makeWriteEffect(
            assignment,
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(right, serial),
                makePrimitiveExpression({ undefined: null }, serial),
                serial,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              makeReadExpression(right, serial),
              serial,
            ),
            serial,
            true,
          ),
          serial,
        ),
        ...unbuildPattern(
          drill({ node, path }, "left"),
          context,
          assignment,
          wrapNode,
          listFinalNode,
        ),
      ];
    }
    case "ArrayPattern": {
      const iterator = mangleMetaVariable(hash, BASENAME, "iterator");
      return [
        wrapNode(
          makeWriteEffect(
            iterator,
            makeApplyExpression(
              makeGetExpression(
                makeReadExpression(right, serial),
                makeIntrinsicExpression("Symbol.iterator", serial),
                serial,
              ),
              makeReadExpression(right, serial),
              [],
              serial,
            ),
            serial,
            true,
          ),
          serial,
        ),
        ...flatMap(
          drillAll(drillArray({ node, path }, "elements")),
          ({ node, path }) => {
            if (node === null) {
              return [
                wrapNode(
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeGetExpression(
                        makeReadExpression(right, serial),
                        makePrimitiveExpression("next", serial),
                        serial,
                      ),
                      makeReadExpression(right, serial),
                      [],
                      serial,
                    ),
                    serial,
                  ),
                  serial,
                ),
              ];
            } else if (node.type === "RestElement") {
              const rest = mangleMetaVariable(hash, BASENAME, "rest");
              return [
                wrapNode(
                  makeWriteEffect(
                    rest,
                    makeApplyExpression(
                      makeIntrinsicExpression("Array.from", serial),
                      makePrimitiveExpression({ undefined: null }, serial),
                      [makeReadExpression(iterator, serial)],
                      serial,
                    ),
                    serial,
                    true,
                  ),
                  serial,
                ),
                ...unbuildPattern(
                  { node, path },
                  context,
                  rest,
                  wrapNode,
                  listFinalNode,
                ),
              ];
            } else {
              const step = mangleMetaVariable(hash, BASENAME, "step");
              return [
                wrapNode(
                  makeWriteEffect(
                    step,
                    makeApplyExpression(
                      makeGetExpression(
                        makeReadExpression(iterator, serial),
                        makePrimitiveExpression("next", serial),
                        serial,
                      ),
                      makeReadExpression(iterator, serial),
                      [],
                      serial,
                    ),
                    serial,
                    true,
                  ),
                  serial,
                ),
                ...unbuildPattern(
                  { node, path },
                  context,
                  step,
                  wrapNode,
                  listFinalNode,
                ),
              ];
            }
          },
        ),
      ];
    }
    case "ObjectPattern": {
      const { init, tail } = extractRest(
        drillAll(drillArray({ node, path }, "properties")),
      );
      if (tail.length === 0) {
        return flatMap(init, (pair) => {
          const property = mangleMetaVariable(
            hash,
            BASENAME,
            `property${index}`,
          );
          return [
            wrapNode(
              makeWriteEffect(
                property,
                makeGetExpression(
                  makeReadExpression(right, serial),
                  unbuildKeyExpression(drill(pair, "key"), context, pair.node),
                  serial,
                ),
                serial,
                true,
              ),
              serial,
            ),
            ...unbuildPattern(
              drill(pair, "value"),
              context,
              property,
              wrapNode,
              listFinalNode,
            ),
          ];
        });
      } else {
        if (tail.length > 1) {
          throw new SyntaxAranError("multiple rest parameters", node);
        }
        const [body, keys] = unzip(
          map(init, (pair) => {
            const key = mangleMetaVariable(hash, BASENAME, `key${index}`);
            const property = mangleMetaVariable(
              hash,
              BASENAME,
              `property${index}`,
            );
            return [
              [
                wrapNode(
                  makeWriteEffect(
                    key,
                    unbuildKeyExpression(
                      drill(pair, "key"),
                      context,
                      pair.node,
                    ),
                    serial,
                    true,
                  ),
                  serial,
                ),
                wrapNode(
                  makeWriteEffect(
                    property,
                    makeGetExpression(
                      makeReadExpression(right, serial),
                      makeReadExpression(key, serial),
                      serial,
                    ),
                    serial,
                    true,
                  ),
                  serial,
                ),
                ...unbuildPattern(
                  drill(pair, "value"),
                  context,
                  property,
                  wrapNode,
                  listFinalNode,
                ),
              ],
              key,
            ];
          }),
        );
        const rest = mangleMetaVariable(hash, BASENAME, "rest");
        return [
          ...flat(body),
          wrapNode(
            makeWriteEffect(
              rest,
              makeApplyExpression(
                makeIntrinsicExpression("Object.assign", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [makeReadExpression(right, serial)],
                serial,
              ),
              serial,
              true,
            ),
            serial,
          ),
          ...map(keys, (key) =>
            wrapNode(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.deleteProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeReadExpression(rest, serial),
                    makeReadExpression(key, serial),
                  ],
                  serial,
                ),
                serial,
              ),
              serial,
            ),
          ),
          ...unbuildPattern(tail[0], context, rest, wrapNode, listFinalNode),
        ];
      }
    }
    case "RestElement":
      return unbuildPattern(
        drill({ node, path }, "argument"),
        context,
        right,
        wrapNode,
        listFinalNode,
      );
    default:
      throw new StaticError(BASENAME, node);
  }
};

/**
 * @type {<S>(
 *   effect: aran.Effect<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
const wrapEffect = (effect, _serial) => effect;

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildPatternEffect = (node, context, right) =>
  unbuildPattern(node, context, right, wrapEffect, listScopeWriteEffect);

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildPatternStatement = (node, context, right) =>
  unbuildPattern(
    node,
    context,
    right,
    makeEffectStatement,
    listScopeInitializeStatement,
  );
