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
  makeThrowErrorExpression,
} from "../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/inner/index.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildKeyExpression } from "./key.mjs";
import { makeGetSuperExpression, makeSetSuperExpression } from "../super.mjs";
import { makeLongSequenceExpression } from "../sequence.mjs";
import { DynamicSyntaxAranError } from "../../error.mjs";
import { unbuildEffect } from "./effect.mjs";

const BASENAME = /** @basename */ "update";

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
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression":
      return makeLongSequenceExpression(
        unbuildEffect(node, context),
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          serial,
        ),
        serial,
      );
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        const value = {
          var: mangleMetaVariable(hash, BASENAME, "value"),
          val: makeGetSuperExpression(
            context,
            makeReadExpression(key.var, serial),
            serial,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, serial, true),
            makeSetSuperExpression(
              context,
              makeReadExpression(key.var, serial),
              makeBinaryExpression(operator, value.val, update, serial),
              serial,
            ),
            serial,
          );
        } else {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, serial, true),
            makeSequenceExpression(
              makeWriteEffect(value.var, value.val, serial, true),
              makeSequenceExpression(
                makeExpressionEffect(
                  makeSetSuperExpression(
                    context,
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
          );
        }
      } else {
        const object = {
          var: mangleMetaVariable(hash, BASENAME, "object"),
          val: unbuildExpression(node.object, context, null),
        };
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        const value = {
          var: mangleMetaVariable(hash, BASENAME, "value"),
          val: makeGetExpression(
            makeReadExpression(object.var, serial),
            makeReadExpression(key.var, serial),
            serial,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(object.var, object.val, serial, true),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, serial, true),
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
            makeWriteEffect(object.var, object.val, serial, true),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, serial, true),
              makeSequenceExpression(
                makeWriteEffect(value.var, value.val, serial, true),
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
          var: mangleMetaVariable(hash, BASENAME, "new_value"),
          val: makeBinaryExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              serial,
            ),
            update,
            serial,
          ),
        };
        return makeLongSequenceExpression(
          [
            makeWriteEffect(new_value.var, new_value.val, serial, true),
            ...listScopeWriteEffect(
              context,
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
          var: mangleMetaVariable(hash, BASENAME, "old_value"),
          val: makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            serial,
          ),
        };
        const new_value = {
          var: mangleMetaVariable(hash, BASENAME, "new_value"),
          val: makeBinaryExpression(
            operator,
            makeReadExpression(old_value.var, serial),
            update,
            serial,
          ),
        };
        return makeLongSequenceExpression(
          [
            makeWriteEffect(old_value.var, old_value.val, serial, true),
            makeWriteEffect(new_value.var, new_value.val, serial, true),
            ...listScopeWriteEffect(
              context,
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
      throw new DynamicSyntaxAranError(
        "Invalid left-hand side in assignment",
        node,
      );
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
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression":
      return [
        ...unbuildEffect(node, context),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "ReferenceError",
            "Invalid left-hand side in assignment",
            serial,
          ),
          serial,
        ),
      ];
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        return [
          makeWriteEffect(key.var, key.val, serial, true),
          makeExpressionEffect(
            makeSetSuperExpression(
              context,
              makeReadExpression(key.var, serial),
              makeBinaryExpression(
                operator,
                makeGetSuperExpression(
                  context,
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
      } else {
        const object = {
          var: mangleMetaVariable(hash, BASENAME, "object"),
          val: unbuildExpression(node.object, context, null),
        };
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.property, context, node),
        };
        return [
          makeWriteEffect(object.var, object.val, serial, true),
          makeWriteEffect(key.var, key.val, serial, true),
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
        var: mangleMetaVariable(hash, BASENAME, "right"),
        val: makeBinaryExpression(
          operator,
          makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            serial,
          ),
          update,
          serial,
        ),
      };
      return [
        makeWriteEffect(right.var, right.val, serial, true),
        ...listScopeWriteEffect(
          context,
          /** @type {estree.Variable} */ (node.name),
          right.var,
          serial,
        ),
      ];
    }
    default:
      throw new DynamicSyntaxAranError(
        "Invalid left-hand side in assignment",
        node,
      );
  }
};
