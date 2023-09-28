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
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { makeGetSuperExpression, makeSetSuperExpression } from "../record.mjs";
import { SyntaxAranError } from "../../error.mjs";
import { unbuildEffect } from "./effect.mjs";
import { ANONYMOUS } from "../name.mjs";

const BASENAME = /** @basename */ "update";

/**
 * @type {<S>(
 *   node: estree.Pattern | estree.Expression,
 *   context: import("../context.js").Context<S>,
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
            { serial, origin: node },
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, serial, true),
            makeSetSuperExpression(
              context,
              makeReadExpression(key.var, serial),
              makeBinaryExpression(operator, value.val, update, serial),
              { serial, origin: node },
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
                    { serial, origin: node },
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
          val: unbuildExpression(node.object, context, { name: ANONYMOUS }),
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
        const new_value = mangleMetaVariable(hash, BASENAME, "new_value");
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              new_value,
              makeBinaryExpression(
                operator,
                makeScopeReadExpression(
                  context,
                  /** @type {estree.Variable} */ (node.name),
                  serial,
                ),
                update,
                serial,
              ),
              serial,
              true,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              new_value,
              serial,
            ),
          ],
          makeReadExpression(new_value, serial),
          serial,
        );
      } else {
        const old_value = mangleMetaVariable(hash, BASENAME, "old_value");
        const new_value = mangleMetaVariable(hash, BASENAME, "new_value");
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              old_value,
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ (node.name),
                serial,
              ),
              serial,
              true,
            ),
            makeWriteEffect(
              new_value,
              makeBinaryExpression(
                operator,
                makeReadExpression(old_value, serial),
                update,
                serial,
              ),
              serial,
              true,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              new_value,
              serial,
            ),
          ],
          makeReadExpression(old_value, serial),
          serial,
        );
      }
    default:
      throw new SyntaxAranError("Invalid left-hand side in assignment", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.Pattern | estree.Expression,
 *   context: import("../context.js").Context<S>,
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
        const key = mangleMetaVariable(hash, BASENAME, "key");
        return [
          makeWriteEffect(
            key,
            unbuildKeyExpression(node.property, context, node),
            serial,
            true,
          ),
          makeExpressionEffect(
            makeSetSuperExpression(
              context,
              makeReadExpression(key, serial),
              makeBinaryExpression(
                operator,
                makeGetSuperExpression(
                  context,
                  makeReadExpression(key, serial),
                  { serial, origin: node },
                ),
                update,
                serial,
              ),
              { serial, origin: node },
            ),
            serial,
          ),
        ];
      } else {
        const object = mangleMetaVariable(hash, BASENAME, "object");
        const key = mangleMetaVariable(hash, BASENAME, "key");
        return [
          makeWriteEffect(
            object,
            unbuildExpression(node.object, context, { name: ANONYMOUS }),
            serial,
            true,
          ),
          makeWriteEffect(
            key,
            unbuildKeyExpression(node.property, context, node),
            serial,
            true,
          ),
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              makeReadExpression(object, serial),
              makeReadExpression(key, serial),
              makeBinaryExpression(
                operator,
                makeGetExpression(
                  makeReadExpression(object, serial),
                  makeReadExpression(key, serial),
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
      const right = mangleMetaVariable(hash, BASENAME, "right");
      return [
        makeWriteEffect(
          right,
          makeBinaryExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              serial,
            ),
            update,
            serial,
          ),
          serial,
          true,
        ),
        ...listScopeWriteEffect(
          context,
          /** @type {estree.Variable} */ (node.name),
          right,
          serial,
        ),
      ];
    }
    default:
      throw new SyntaxAranError("Invalid left-hand side in assignment", node);
  }
};
