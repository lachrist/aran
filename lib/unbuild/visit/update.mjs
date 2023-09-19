import { DynamicError } from "../../util/index.mjs";

import {
  makeExpressionEffect,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";

import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildKeyExpression } from "./key.mjs";
import { makeGetSuperExpression, makeSetSuperExpression } from "../super.mjs";
import { makeLongSequenceExpression } from "../sequence.mjs";
import { TypeSyntaxAranError } from "../../error.mjs";

/**
 * @type {<S>(
 *   node: estree.Pattern | estree.Expression,
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     prefix: boolean,
 *     update: aran.Expression<unbuild.Atom<S>>,
 *     serial: S,
 *     hash: unbuild.Hash,
 *     operator: estree.BinaryOperator,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildUpdateExpression = (
  node,
  context,
  { update, serial, hash, prefix, operator },
) => {
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const key = {
          var: mangleMetaVariable(hash, "update_expression", "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        const value = {
          var: mangleMetaVariable(hash, "update_expression", "value"),
          val: makeGetSuperExpression(
            makeReadExpression(key.var, serial),
            context,
            serial,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, serial),
            makeSetSuperExpression(
              makeReadExpression(key.var, serial),
              makeBinaryExpression(operator, value.val, update, serial),
              context,
              serial,
            ),
            serial,
          );
        } else {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, serial),
            makeSequenceExpression(
              makeWriteEffect(value.var, value.val, serial),
              makeSequenceExpression(
                makeExpressionEffect(
                  makeSetSuperExpression(
                    makeReadExpression(key.var, serial),
                    makeBinaryExpression(
                      operator,
                      makeReadExpression(value.var, serial),
                      update,
                      serial,
                    ),
                    context,
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
          );
        }
      } else {
        const object = {
          var: mangleMetaVariable(hash, "update_expression", "object"),
          val: unbuildExpression(node.object, context, null),
        };
        const key = {
          var: mangleMetaVariable(hash, "update_expression", "key"),
          val: unbuildKeyExpression(node.property, context, node),
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
                makeBinaryExpression(operator, value.val, update, serial),
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
                        operator,
                        makeReadExpression(value.var, serial),
                        update,
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
            operator,
            makeScopeReadExpression(
              context.strict,
              context.scope,
              /** @type {estree.Variable} */ (node.name),
              serial,
            ),
            update,
            serial,
          ),
        };
        return makeLongSequenceExpression(
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
          makeReadExpression(new_value.var, serial),
          serial,
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
            operator,
            makeReadExpression(old_value.var, serial),
            update,
            serial,
          ),
        };
        return makeLongSequenceExpression(
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
          makeReadExpression(old_value.var, serial),
          serial,
        );
      }
    default:
      throw new TypeSyntaxAranError("update pattern", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.Pattern | estree.Expression,
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     update: aran.Expression<unbuild.Atom<S>>,
 *     operator: estree.BinaryOperator,
 *     serial: S,
 *     hash: unbuild.Hash,
 *   }
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildUpdateEffect = (
  node,
  context,
  { update, operator, serial, hash },
) => {
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const key = {
          var: mangleMetaVariable(hash, "update_expression", "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        return [
          makeWriteEffect(key.var, key.val, serial),
          makeExpressionEffect(
            makeSetSuperExpression(
              makeReadExpression(key.var, serial),
              makeBinaryExpression(
                operator,
                makeGetSuperExpression(
                  makeReadExpression(key.var, serial),
                  context,
                  serial,
                ),
                update,
                serial,
              ),
              context,
              serial,
            ),
            serial,
          ),
        ];
      } else {
        const object = {
          var: mangleMetaVariable(hash, "update_expression", "object"),
          val: unbuildExpression(node.object, context, null),
        };
        const key = {
          var: mangleMetaVariable(hash, "update_expression", "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        return [
          makeWriteEffect(object.var, object.val, serial),
          makeWriteEffect(key.var, key.val, serial),
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              makeReadExpression(object.var, serial),
              makeReadExpression(key.var, serial),
              makeBinaryExpression(
                operator,
                makeGetExpression(
                  makeReadExpression(object.var, serial),
                  makeReadExpression(key.var, serial),
                  serial,
                ),
                update,
                serial,
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "Identifier": {
      const right = {
        var: mangleMetaVariable(hash, "update_effect", "right"),
        val: makeBinaryExpression(
          operator,
          makeScopeReadExpression(
            context.strict,
            context.scope,
            /** @type {estree.Variable} */ (node.name),
            serial,
          ),
          update,
          serial,
        ),
      };
      return [
        makeWriteEffect(right.var, right.val, serial),
        ...listScopeWriteEffect(
          context.strict,
          context.scope,
          /** @type {estree.Variable} */ (node.name),
          right.var,
          serial,
        ),
      ];
    }
    default:
      throw new TypeSyntaxAranError("update pattern", node);
  }
};
