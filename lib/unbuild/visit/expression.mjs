import {
  DynamicError,
  StaticError,
  hasOwn,
  reduceReverse,
} from "../../util/index.mjs";

import {
  makeApplyExpression,
  makeAwaitExpression,
  makeIntrinsicExpression,
  makeParameterExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeYieldExpression,
} from "../node.mjs";

import {
  makeBinaryExpression,
  makeDeleteExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";

import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/index.mjs";
import { unbuildDeleteExpression } from "./delete.mjs";
import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";

/** @type {(node: estree.Node) => estree.Node} */
const extractChain = (node) =>
  node.type === "ChainExpression" ? extractChain(node.expression) : node;

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.js").Context<S>,
 *   name: Variable | null,
 * ) => Expression<S>}
 */
export const unbuildExpression = (node, context, _name) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "ThisExpression":
      return makeParameterExpression("this", serial);
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeParameterExpression("new.target", serial);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeParameterExpression("import.meta", serial);
      } else {
        throw new DynamicError("invalid meta property", node);
      }
    case "Literal":
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(node.regex.pattern, serial),
            makePrimitiveExpression(node.regex.flags, serial),
          ],
          serial,
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression({ bigint: node.bigint }, serial);
      } else {
        return makePrimitiveExpression(node.value, serial);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context.strict,
        context.scope,
        /** @type {Variable} */ (node.name),
        serial,
      );
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context.strict,
                context.scope,
                /** @type {Variable} */ (node.argument.name),
                serial,
              )
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(node.argument, context, null),
                serial,
              );
        case "delete": {
          const argument = extractChain(node.argument);
          if (argument.type === "MemberExpression") {
            if (argument.object.type === "Super") {
              return reduceReverse(
                unbuildKeyEffect(argument.property, context, argument.computed),
                (expression, effect) =>
                  makeSequenceExpression(effect, expression, serial),
                makeThrowErrorExpression(
                  "ReferenceError",
                  "Unsupported reference to 'super'",
                  serial,
                ),
              );
            } else {
              return makeDeleteExpression(
                context.strict,
                unbuildExpression(argument.object, context, null),
                unbuildKeyExpression(
                  argument.property,
                  context,
                  argument.computed,
                ),
                serial,
              );
            }
          } else {
            return reduceReverse(
              unbuildEffect(node, context),
              (expression, effect) =>
                makeSequenceExpression(effect, expression, serial),
              makePrimitiveExpression(true, serial),
            );
          }
        }
        default:
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(node.argument, context, null),
            serial,
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(node.left, context, null),
        unbuildExpression(node.right, context, null),
        serial,
      );
    case "AwaitExpression":
      return makeAwaitExpression(
        unbuildExpression(node.argument, context, null),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        node.argument == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : unbuildExpression(node.argument, context, null),
        serial,
      );
    default:
      throw new StaticError("invalid estree expression node", node);
  }
};
