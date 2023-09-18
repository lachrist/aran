import { DynamicError, reduceReverse } from "../../util/index.mjs";

import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../../node.mjs";

import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildKeyExpression } from "./key.mjs";

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   site: {
 *     prefix: boolean,
 *     operator: "++" | "--",
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildUpdateExpression = (
  node,
  context,
  { prefix, operator },
) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        return "TODO";
      } else {
        const object = {
          var: mangleMetaVariable(hash, "update_expression", "object"),
          val: unbuildExpression(node.object, context, null),
        };
        const key = {
          var: mangleMetaVariable(hash, "update_expression", "key"),
          val: unbuildKeyExpression(node.property, context, node.computed),
        };
        const value = {
          var: mangleMetaVariable(hash, "update_expression", "value"),
          val: makeGetExpression(
            makeReadExpression(object.var, serial),
            makeReadExpression(key.var, serial),
            serial,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(object.var, object.val, serial),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, serial),
              makeSetExpression(
                context.strict,
                makeReadExpression(object.var, serial),
                makeReadExpression(key.var, serial),
                makeBinaryExpression(
                  /** @type {("+" | "-")} */ (operator[0]),
                  value.val,
                  makePrimitiveExpression(1, serial),
                  serial,
                ),
                serial,
              ),
              serial,
            ),
            serial,
          );
        } else {
          return makeSequenceExpression(
            makeWriteEffect(object.var, object.val, serial),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, serial),
              makeSequenceExpression(
                makeWriteEffect(value.var, value.val, serial),
                makeSequenceExpression(
                  makeExpressionEffect(
                    makeSetExpression(
                      context.strict,
                      makeReadExpression(object.var, serial),
                      makeReadExpression(key.var, serial),
                      makeBinaryExpression(
                        /** @type {("+" | "-")} */ (operator[0]),
                        makeReadExpression(value.var, serial),
                        makePrimitiveExpression(1, serial),
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                  makeReadExpression(value.var, serial),
                  serial,
                ),
                serial,
              ),
              serial,
            ),
            serial,
          );
        }
      }
    case "Identifier":
      if (prefix) {
        const new_value = {
          var: mangleMetaVariable(hash, "update_expression", "new_value"),
          val: makeBinaryExpression(
            /** @type {("+" | "-")} */ (operator[0]),
            makeScopeReadExpression(
              context.strict,
              context.scope,
              /** @type {estree.Variable} */ (node.name),
              serial,
            ),
            makePrimitiveExpression(1, serial),
            serial,
          ),
        };
        return reduceReverse(
          [
            makeWriteEffect(new_value.var, new_value.val, serial),
            ...listScopeWriteEffect(
              context.strict,
              context.scope,
              /** @type {estree.Variable} */ (node.name),
              new_value.var,
              serial,
            ),
          ],
          (expression, effect) =>
            makeSequenceExpression(effect, expression, serial),
          makeReadExpression(new_value.var, serial),
        );
      } else {
        const old_value = {
          var: mangleMetaVariable(hash, "update_expression", "old_value"),
          val: makeScopeReadExpression(
            context.strict,
            context.scope,
            /** @type {estree.Variable} */ (node.name),
            serial,
          ),
        };
        const new_value = {
          var: mangleMetaVariable(hash, "update_expression", "new_value"),
          val: makeBinaryExpression(
            /** @type {("+" | "-")} */ (operator[0]),
            makeReadExpression(old_value.var, serial),
            makePrimitiveExpression(1, serial),
            serial,
          ),
        };
        return reduceReverse(
          [
            makeWriteEffect(old_value.var, old_value.val, serial),
            makeWriteEffect(new_value.var, new_value.val, serial),
            ...listScopeWriteEffect(
              context.strict,
              context.scope,
              /** @type {estree.Variable} */ (node.name),
              new_value.var,
              serial,
            ),
          ],
          (expression, effect) =>
            makeSequenceExpression(effect, expression, serial),
          makeReadExpression(old_value.var, serial),
        );
      }
    default:
      throw new DynamicError("invalid update left-hand side", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   site: {
 *     operator: "++" | "--",
 *   }
 * ) => Effect<S>[]}
 */
export const unbuildUpdateEffect = (node, context, { operator }) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const memo = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "key"),
          unbuildKey(node.property, context, node.computed),
          serial,
        );
        const right = makeBinaryExpression(
          /** @type {("+" | "-")} */ (operator[0]),
          makeApplyExpression(
            makeParameterExpression("super.get", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [memo.load],
            serial,
          ),
          makePrimitiveExpression(1, serial),
          serial,
        );
        if (context.super === null) {
          return [
            ...memo.save,
            makeExpressionEffect(
              makeApplyExpression(
                makeParameterExpression("super.set", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [memo.load, right],
                serial,
              ),
              serial,
            ),
          ];
        } else {
          return [
            ...memo.save,
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                makeScopeLoadExpression(
                  context.strict,
                  context.scope,
                  context.super,
                  serial,
                ),
                memo.load,
                right,
                serial,
              ),
              serial,
            ),
          ];
        }
      } else {
        const memo1 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "object"),
          unbuildExpression(node.object, context, null),
          serial,
        );
        const memo2 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "key"),
          unbuildKey(node.property, context, node.computed),
          serial,
        );
        return [
          ...memo1.save,
          ...memo2.save,
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              memo1.load,
              memo2.load,
              makeBinaryExpression(
                /** @type {("+" | "-")} */ (operator[0]),
                makeGetExpression(memo1.load, memo2.load, serial),
                makePrimitiveExpression(1, serial),
                serial,
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "Identifier": {
      const memo = memoize(
        context.strict,
        context.scope,
        context.mangle(node, "update_effect", "variable"),
        makeScopeReadExpression(
          context.strict,
          context.scope,
          /** @type {Variable} */ (node.name),
          serial,
        ),
        serial,
      );
      return [
        ...memo.save,
        ...listMemoScopeWriteEffect(
          context.strict,
          context.scope,
          {
            base: /** @type {Variable} */ (node.name),
            meta: context.mangle(node, "update_effect", "variable"),
          },
          makeBinaryExpression(
            /** @type {("+" | "-")} */ (operator[0]),
            memo.load,
            makePrimitiveExpression(1, serial),
            serial,
          ),
          serial,
        ),
      ];
    }
    default:
      throw new DynamicError("invalid update pattern", node);
  }
};
