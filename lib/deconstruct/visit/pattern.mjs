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
  makeSequenceExpression,
} from "../../node.mjs";

import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";

import {
  makeMetaReadExpression,
  makeMetaWriteEffect,
  mangleMetaVariable,
} from "../layer/index.mjs";

import {
  listScopeInitializeStatement,
  listScopeWriteEffect,
} from "../scope/index.mjs";

import { deconstructExpression } from "./expression.mjs";

import { deconstructKeyExpression } from "./key.mjs";

/** @typedef {import("../layer/index.mjs").MetaVariable} MetaVariable */

/** @type {(node: estree.Node) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {<S, N extends Node<S>>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   right: MetaVariable,
 *   wrapNode: (effect: Effect<S>, serial: S) => N,
 *   listFinalNode: (
 *     strict: boolean,
 *     scope: import("../scope/index.mjs").Scope<S>,
 *     variable: Variable,
 *     right: Expression<S>,
 *     serial: S,
 *   ) => N[],
 * ) => N[]}
 */
const deconstructPattern = (node, context, right, wrapNode, listFinalNode) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "Identifier":
      return listFinalNode(
        context.strict,
        context.scope,
        /** @type {Variable} */ (node.name),
        makeMetaReadExpression(right, serial),
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
                deconstructExpression(node.object, context, null),
                deconstructKeyExpression(node.property, context, node.computed),
                makeMetaReadExpression(right, serial),
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
          makeMetaWriteEffect(
            assignment,
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeMetaReadExpression(right, serial),
                makePrimitiveExpression({ undefined: null }, serial),
                serial,
              ),
              deconstructExpression(node.right, context, null),
              makeMetaReadExpression(right, serial),
              serial,
            ),
            serial,
          ),
          serial,
        ),
        ...deconstructPattern(
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
          makeMetaWriteEffect(
            iterator,
            makeApplyExpression(
              makeGetExpression(
                makeMetaReadExpression(right, serial),
                makeIntrinsicExpression("Symbol.iterator", serial),
                serial,
              ),
              makeMetaReadExpression(right, serial),
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
                      makeMetaReadExpression(right, serial),
                      makePrimitiveExpression("next", serial),
                      serial,
                    ),
                    makeMetaReadExpression(right, serial),
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
                makeMetaWriteEffect(
                  rest,
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.from", serial),
                    makePrimitiveExpression({ undefined: null }, serial),
                    [makeMetaReadExpression(iterator, serial)],
                    serial,
                  ),
                  serial,
                ),
                serial,
              ),
              ...deconstructPattern(
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
                makeMetaWriteEffect(
                  step,
                  makeApplyExpression(
                    makeGetExpression(
                      makeMetaReadExpression(iterator, serial),
                      makePrimitiveExpression("next", serial),
                      serial,
                    ),
                    makeMetaReadExpression(iterator, serial),
                    [],
                    serial,
                  ),
                  serial,
                ),
                serial,
              ),
              ...deconstructPattern(
                child,
                context,
                step,
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
              makeMetaWriteEffect(
                property,
                makeGetExpression(
                  makeMetaReadExpression(right, serial),
                  deconstructKeyExpression(
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
            ...deconstructPattern(
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
                  makeMetaWriteEffect(
                    property,
                    makeGetExpression(
                      makeMetaReadExpression(right, serial),
                      makeSequenceExpression(
                        makeMetaWriteEffect(
                          key,
                          deconstructKeyExpression(
                            properties[index].key,
                            context,
                            properties[index].computed,
                          ),
                          serial,
                        ),
                        makeMetaReadExpression(key, serial),
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                  serial,
                ),
                ...deconstructPattern(
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
            makeMetaWriteEffect(
              rest_variable,
              makeApplyExpression(
                makeIntrinsicExpression("Object.assign", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [makeMetaReadExpression(right, serial)],
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
                    makeMetaReadExpression(rest_variable, serial),
                    makeMetaReadExpression(key, serial),
                  ],
                  serial,
                ),
                serial,
              ),
              serial,
            ),
          ),
          ...deconstructPattern(
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

/** @type {<S>(effect: Effect<S>, serial: S) => Effect<S>} */
const wrapEffect = (effect, _serial) => effect;

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   right: MetaVariable,
 * ) => Effect<S>[]}
 */
export const deconstructPatternEffect = (node, context, right) =>
  deconstructPattern(node, context, right, wrapEffect, listScopeWriteEffect);

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   right: MetaVariable,
 * ) => Statement<S>[]}
 */
export const deconstructPatternStatement = (node, context, right) =>
  deconstructPattern(
    node,
    context,
    right,
    makeEffectStatement,
    listScopeInitializeStatement,
  );
