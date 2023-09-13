import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";
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
  DynamicError,
  StaticError,
  enumerate,
  filter,
  filterOut,
  flat,
  flatMap,
  map,
  reduceReverse,
  some,
  unzip,
} from "../../util/index.mjs";
import { memoize } from "../memoize.mjs";
import {
  listScopeInitializeStatement,
  listScopeSaveEffect,
  listScopeWriteEffect,
  makeScopeLoadExpression,
} from "../scope/index.mjs";
import { makeMetaSaveEffect } from "../scope/meta.mjs";
import { mangleMetaVariable } from "../scope/variable.mjs";
import { deconstructExpression } from "./expression.mjs";
import { deconstructKeyExpression } from "./key.mjs";

/** @type {(node: estree.Node) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {<S, N extends Node<S>>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   right: Variable,
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
  const serial = context.serialize(node);
  switch (node.type) {
    case "Identifier":
      return listFinalNode(
        context.strict,
        context.scope,
        /** @type {Variable} */ (node.name),
        makeScopeLoadExpression(context.strict, context.scope, right, serial),
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
                makeScopeLoadExpression(
                  context.strict,
                  context.scope,
                  right,
                  serial,
                ),
                serial,
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "AssignmentPattern": {
      const assignment = context.mangle(node, "pattern", "assignment");
      return [
        ...map(
          listScopeSaveEffect(
            context.strict,
            context.scope,
            assignment,
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeScopeLoadExpression(
                  context.strict,
                  context.scope,
                  right,
                  serial,
                ),
                makePrimitiveExpression({ undefined: null }, serial),
                serial,
              ),
              deconstructExpression(node.right, context, null),
              makeScopeLoadExpression(
                context.strict,
                context.scope,
                right,
                serial,
              ),
              serial,
            ),
            serial,
          ),
          (effect) => wrapNode(effect, serial),
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
      const iterator = context.mangle(node, "pattern", "iterator");
      return [
        ...map(
          listScopeSaveEffect(
            context.strict,
            context.scope,
            iterator,
            makeApplyExpression(
              makeGetExpression(
                makeScopeLoadExpression(
                  context.strict,
                  context.scope,
                  right,
                  serial,
                ),
                makeIntrinsicExpression("Symbol.iterator", serial),
                serial,
              ),
              makeScopeLoadExpression(
                context.strict,
                context.scope,
                right,
                serial,
              ),
              [],
              serial,
            ),
            serial,
          ),
          (effect) => wrapNode(effect, serial),
        ),
        ...flatMap(enumerate(node.elements.length), (index) => {
          const child = node.elements[index];
          if (child === null) {
            return [
              wrapNode(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeGetExpression(
                      makeScopeLoadExpression(
                        context.strict,
                        context.scope,
                        right,
                        serial,
                      ),
                      makePrimitiveExpression("next", serial),
                      serial,
                    ),
                    makeScopeLoadExpression(
                      context.strict,
                      context.scope,
                      right,
                      serial,
                    ),
                    [],
                    serial,
                  ),
                  serial,
                ),
                serial,
              ),
            ];
          } else if (child.type === "RestElement") {
            const rest = context.mangle(node, "pattern", "rest");
            return [
              ...map(
                listScopeSaveEffect(
                  context.strict,
                  context.scope,
                  rest,
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.from", serial),
                    makePrimitiveExpression({ undefined: null }, serial),
                    [
                      makeScopeLoadExpression(
                        context.strict,
                        context.scope,
                        iterator,
                        serial,
                      ),
                    ],
                    serial,
                  ),
                  serial,
                ),
                (effect) => wrapNode(effect, serial),
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
            const step = context.mangle(node, "pattern", `step${index}`);
            return [
              ...map(
                listScopeSaveEffect(
                  context.strict,
                  context.scope,
                  step,
                  makeApplyExpression(
                    makeGetExpression(
                      makeScopeLoadExpression(
                        context.strict,
                        context.scope,
                        iterator,
                        serial,
                      ),
                      makePrimitiveExpression("next", serial),
                      serial,
                    ),
                    makeScopeLoadExpression(
                      context.strict,
                      context.scope,
                      iterator,
                      serial,
                    ),
                    [],
                    serial,
                  ),
                  serial,
                ),
                (effect) => wrapNode(effect, serial),
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
          const variable = context.mangle(node, "pattern", `property${index}`);
          return [
            ...map(
              listScopeSaveEffect(
                context.strict,
                context.scope,
                variable,
                makeGetExpression(
                  makeScopeLoadExpression(
                    context.strict,
                    context.scope,
                    right,
                    serial,
                  ),
                  deconstructKeyExpression(
                    properties[index].key,
                    context,
                    properties[index].computed,
                  ),
                  serial,
                ),
                serial,
              ),
              (effect) => wrapNode(effect, serial),
            ),
            ...deconstructPattern(
              properties[index].value,
              context,
              variable,
              wrapNode,
              listFinalNode,
            ),
          ];
        });
      } else {
        const [body, keys] = unzip(
          map(enumerate(properties.length), (index) => {
            const variable = context.mangle(
              node,
              "pattern",
              `property${index}`,
            );
            const memo = memoize(
              context.strict,
              context.scope,
              variable,
              deconstructKeyExpression(
                properties[index].key,
                context,
                properties[index].computed,
              ),
              serial,
            );
            return [
              [
                ...map(
                  listScopeSaveEffect(
                    context.strict,
                    context.scope,
                    variable,
                    makeGetExpression(
                      makeScopeLoadExpression(
                        context.strict,
                        context.scope,
                        right,
                        serial,
                      ),
                      reduceReverse(
                        memo.save,
                        (expression, effect) =>
                          makeSequenceExpression(effect, expression, serial),
                        memo.load,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                  (effect) => wrapNode(effect, serial),
                ),
                ...deconstructPattern(
                  properties[index].value,
                  context,
                  variable,
                  wrapNode,
                  listFinalNode,
                ),
              ],
              memo.load,
            ];
          }),
        );
        const rest_variable = context.mangle(node, "pattern", "rest");
        return [
          ...flat(body),
          ...map(
            listScopeSaveEffect(
              context.strict,
              context.scope,
              rest_variable,
              makeApplyExpression(
                makeIntrinsicExpression("Object.assign", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeScopeLoadExpression(
                    context.strict,
                    context.scope,
                    right,
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
            (effect) => wrapNode(effect, serial),
          ),
          ...map(keys, (key) =>
            wrapNode(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.deleteProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeScopeLoadExpression(
                      context.strict,
                      context.scope,
                      rest_variable,
                      serial,
                    ),
                    key,
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
 *   right: Variable,
 * ) => Effect<S>[]}
 */
export const deconstructPatternEffect = (node, context, right) =>
  deconstructPattern(node, context, right, wrapEffect, listScopeWriteEffect);

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   right: Variable,
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
