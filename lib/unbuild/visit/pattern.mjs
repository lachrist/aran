import {
  DynamicError,
  StaticError,
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
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";

import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import {
  listScopeInitializeStatement,
  listScopeWriteEffect,
} from "../scope/index.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildKeyExpression } from "./key.mjs";

/** @type {(node: estree.Node) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {<S, N extends aran.Node<unbuild.Atom<S>>>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   right: unbuild.Variable,
 *   wrapNode: (effect: aran.Effect<unbuild.Atom<S>>, serial: S) => N,
 *   listFinalNode: (
 *     strict: boolean,
 *     scope: import("../scope/index.mjs").Scope<S>,
 *     variable: estree.Variable,
 *     right: unbuild.Variable,
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
        context.strict,
        context.scope,
        /** @type {estree.Variable} */ (node.name),
        right,
        serial,
      );
    case "MemberExpression":
      if (node.object.type === "Super") {
        return TODO;
      } else {
        return [
          wrapNode(
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                unbuildExpression(node.object, context, null),
                unbuildKeyExpression(node.property, context, node.computed),
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
      const assignment = mangleMetaVariable(hash, "pattern", "assignment");
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
              unbuildExpression(node.right, context, null),
              makeReadExpression(right, serial),
              serial,
            ),
            serial,
          ),
          serial,
        ),
        ...unbuildPattern(
          node.left,
          context,
          assignment,
          wrapNode,
          listFinalNode,
        ),
      ];
    }
    case "ArrayPattern": {
      const iterator = mangleMetaVariable(hash, "pattern", "iterator");
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
          ),
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
            const rest = mangleMetaVariable(hash, "pattern", "rest");
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
                ),
                serial,
              ),
              ...unbuildPattern(
                child.argument,
                context,
                rest,
                wrapNode,
                listFinalNode,
              ),
            ];
          } else {
            const step = mangleMetaVariable(hash, "pattern", "step");
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
                ),
                serial,
              ),
              ...unbuildPattern(child, context, step, wrapNode, listFinalNode),
            ];
          }
        }),
      ];
    }
    case "ObjectPattern": {
      const properties = /** @type {estree.AssignmentProperty[]} */ (
        filterOut(node.properties, isRestElement)
      );
      const rest = /** @type {estree.RestElement | null} */ (
        node.properties.length > 0 &&
        node.properties[node.properties.length - 1].type === "RestElement"
          ? node.properties[node.properties.length - 1]
          : null
      );
      if (rest === null) {
        return flatMap(enumerate(properties.length), (index) => {
          const property = mangleMetaVariable(
            hash,
            "pattern",
            `property${index}`,
          );
          return [
            wrapNode(
              makeWriteEffect(
                property,
                makeGetExpression(
                  makeReadExpression(right, serial),
                  unbuildKeyExpression(
                    properties[index].key,
                    context,
                    properties[index].computed,
                  ),
                  serial,
                ),
                serial,
              ),
              serial,
            ),
            ...unbuildPattern(
              properties[index].value,
              context,
              property,
              wrapNode,
              listFinalNode,
            ),
          ];
        });
      } else {
        const [body, keys] = unzip(
          map(enumerate(properties.length), (index) => {
            const property = mangleMetaVariable(
              hash,
              "pattern",
              `property${index}`,
            );
            const key = mangleMetaVariable(hash, "pattern", `key${index}`);
            return [
              [
                wrapNode(
                  makeWriteEffect(
                    property,
                    makeGetExpression(
                      makeReadExpression(right, serial),
                      makeSequenceExpression(
                        makeWriteEffect(
                          key,
                          unbuildKeyExpression(
                            properties[index].key,
                            context,
                            properties[index].computed,
                          ),
                          serial,
                        ),
                        makeReadExpression(key, serial),
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                  serial,
                ),
                ...unbuildPattern(
                  properties[index].value,
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
        const rest_variable = mangleMetaVariable(hash, "pattern", "rest");
        return [
          ...flat(body),
          wrapNode(
            makeWriteEffect(
              rest_variable,
              makeApplyExpression(
                makeIntrinsicExpression("Object.assign", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [makeReadExpression(right, serial)],
                serial,
              ),
              serial,
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
                    makeReadExpression(rest_variable, serial),
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
            rest.argument,
            context,
            rest_variable,
            wrapNode,
            listFinalNode,
          ),
        ];
      }
    }
    case "RestElement":
      throw new DynamicError("illegal RestElement node", node);
    default:
      throw new StaticError("invalid pattern node", node);
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
 *   right: unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildPatternEffect = (node, context, right) =>
  unbuildPattern(node, context, right, wrapEffect, listScopeWriteEffect);

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   right: unbuild.Variable,
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
