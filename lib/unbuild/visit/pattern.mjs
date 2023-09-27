import {
  enumerate,
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
import { StaticSyntaxAranError } from "../../error.mjs";
import { ANONYMOUS } from "../name.mjs";

const BASENAME = /** @basename */ "pattern";

/** @type {(node: estree.Node) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {<S, N extends aran.Node<unbuild.Atom<S>>>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   right: aran.Parameter | unbuild.Variable,
 *   wrapNode: (effect: aran.Effect<unbuild.Atom<S>>, serial: S) => N,
 *   listFinalNode: (
 *     context: {
 *       strict: boolean,
 *       scope: import("../scope/inner/index.mjs").Scope<S>,
 *     },
 *     variable: estree.Variable,
 *     right: aran.Parameter | unbuild.Variable,
 *     serial: S,
 *   ) => N[],
 * ) => N[]}
 */
const unbuildPattern = (node, context, right, wrapNode, listFinalNode) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "Identifier":
      return listFinalNode(
        context,
        /** @type {estree.Variable} */ (node.name),
        right,
        serial,
      );
    case "MemberExpression":
      if (node.object.type === "Super") {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetSuperExpression(
                context,
                unbuildKeyExpression(node.property, context, node),
                makeReadExpression(right, serial),
                { serial, origin: node },
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
              makeSetExpression(
                context.strict,
                unbuildExpression(node.object, context, { name: ANONYMOUS }),
                unbuildKeyExpression(node.property, context, node),
                makeReadExpression(right, serial),
                serial,
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "AssignmentPattern": {
      const assignment = {
        var: mangleMetaVariable(hash, BASENAME, "assignment"),
        val: makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadExpression(right, serial),
            makePrimitiveExpression({ undefined: null }, serial),
            serial,
          ),
          unbuildExpression(node.right, context, { name: ANONYMOUS }),
          makeReadExpression(right, serial),
          serial,
        ),
      };
      return [
        wrapNode(
          makeWriteEffect(assignment.var, assignment.val, serial, true),
          serial,
        ),
        ...unbuildPattern(
          node.left,
          context,
          assignment.var,
          wrapNode,
          listFinalNode,
        ),
      ];
    }
    case "ArrayPattern": {
      const iterator = {
        var: mangleMetaVariable(hash, BASENAME, "iterator"),
        val: makeApplyExpression(
          makeGetExpression(
            makeReadExpression(right, serial),
            makeIntrinsicExpression("Symbol.iterator", serial),
            serial,
          ),
          makeReadExpression(right, serial),
          [],
          serial,
        ),
      };
      return [
        wrapNode(
          makeWriteEffect(iterator.var, iterator.val, serial, true),
          serial,
        ),
        ...flatMap(enumerate(node.elements.length), (index) => {
          const child = node.elements[index];
          if (child === null) {
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
          } else if (child.type === "RestElement") {
            const rest = {
              var: mangleMetaVariable(hash, BASENAME, "rest"),
              val: makeApplyExpression(
                makeIntrinsicExpression("Array.from", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [makeReadExpression(iterator.var, serial)],
                serial,
              ),
            };
            return [
              wrapNode(
                makeWriteEffect(rest.var, rest.val, serial, true),
                serial,
              ),
              ...unbuildPattern(
                child,
                context,
                rest.var,
                wrapNode,
                listFinalNode,
              ),
            ];
          } else {
            const step = {
              var: mangleMetaVariable(hash, BASENAME, "step"),
              val: makeApplyExpression(
                makeGetExpression(
                  makeReadExpression(iterator.var, serial),
                  makePrimitiveExpression("next", serial),
                  serial,
                ),
                makeReadExpression(iterator.var, serial),
                [],
                serial,
              ),
            };
            return [
              wrapNode(
                makeWriteEffect(step.var, step.val, serial, true),
                serial,
              ),
              ...unbuildPattern(
                child,
                context,
                step.var,
                wrapNode,
                listFinalNode,
              ),
            ];
          }
        }),
      ];
    }
    case "ObjectPattern": {
      const properties = /** @type {estree.AssignmentProperty[]} */ (
        filterOut(node.properties, isRestElement)
      );
      const rest_node = /** @type {estree.RestElement | null} */ (
        node.properties.length > 0 &&
        node.properties[node.properties.length - 1].type === "RestElement"
          ? node.properties[node.properties.length - 1]
          : null
      );
      if (rest_node === null) {
        return flatMap(enumerate(properties.length), (index) => {
          const property = {
            var: mangleMetaVariable(hash, BASENAME, `property${index}`),
            val: makeGetExpression(
              makeReadExpression(right, serial),
              unbuildKeyExpression(
                properties[index].key,
                context,
                properties[index],
              ),
              serial,
            ),
          };
          return [
            wrapNode(
              makeWriteEffect(property.var, property.val, serial, true),
              serial,
            ),
            ...unbuildPattern(
              properties[index].value,
              context,
              property.var,
              wrapNode,
              listFinalNode,
            ),
          ];
        });
      } else {
        const [body, keys] = unzip(
          map(enumerate(properties.length), (index) => {
            const key = {
              var: mangleMetaVariable(hash, BASENAME, `key${index}`),
              val: unbuildKeyExpression(
                properties[index].key,
                context,
                properties[index],
              ),
            };
            const property = {
              var: mangleMetaVariable(hash, BASENAME, `property${index}`),
              val: makeGetExpression(
                makeReadExpression(right, serial),
                makeReadExpression(key.var, serial),
                serial,
              ),
            };
            return [
              [
                wrapNode(
                  makeWriteEffect(key.var, key.val, serial, true),
                  serial,
                ),
                wrapNode(
                  makeWriteEffect(property.var, property.val, serial, true),
                  serial,
                ),
                ...unbuildPattern(
                  properties[index].value,
                  context,
                  property.var,
                  wrapNode,
                  listFinalNode,
                ),
              ],
              key.var,
            ];
          }),
        );
        const rest = {
          var: mangleMetaVariable(hash, BASENAME, "rest"),
          val: makeApplyExpression(
            makeIntrinsicExpression("Object.assign", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [makeReadExpression(right, serial)],
            serial,
          ),
        };
        return [
          ...flat(body),
          wrapNode(makeWriteEffect(rest.var, rest.val, serial, true), serial),
          ...map(keys, (key) =>
            wrapNode(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.deleteProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeReadExpression(rest.var, serial),
                    makeReadExpression(key, serial),
                  ],
                  serial,
                ),
                serial,
              ),
              serial,
            ),
          ),
          ...unbuildPattern(
            rest_node,
            context,
            rest.var,
            wrapNode,
            listFinalNode,
          ),
        ];
      }
    }
    case "RestElement":
      return unbuildPattern(
        node.argument,
        context,
        right,
        wrapNode,
        listFinalNode,
      );
    default:
      throw new StaticSyntaxAranError(BASENAME, node);
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
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildPatternEffect = (node, context, right) =>
  unbuildPattern(node, context, right, wrapEffect, listScopeWriteEffect);

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
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
