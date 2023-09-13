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
} from "../../node.mjs";

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
import { deconstructDeleteExpression } from "./delete.mjs";
import { deconstructKeyEffect, deconstructKeyExpression } from "./key.mjs";
import { deconstructEffect } from "./effect.mjs";

/** @type {(node: estree.Node) => estree.Node} */
const extractChain = (node) =>
  node.type === "ChainExpression" ? extractChain(node.expression) : node;

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.d.ts").Context<S>,
 *   name: Variable | null,
 * ) => Expression<S>}
 */
export const deconstructExpression = (node, context, _name) => {
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
                deconstructExpression(node.argument, context, null),
                serial,
              );
        case "delete": {
          const argument = extractChain(node.argument);
          if (argument.type === "MemberExpression") {
            if (argument.object.type === "Super") {
              return reduceReverse(
                deconstructKeyEffect(
                  argument.property,
                  context,
                  argument.computed,
                ),
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
                deconstructExpression(argument.object, context, null),
                deconstructKeyExpression(
                  argument.property,
                  context,
                  argument.computed,
                ),
                serial,
              );
            }
          } else {
            return reduceReverse(
              deconstructEffect(node, context),
              (expression, effect) =>
                makeSequenceExpression(effect, expression, serial),
              makePrimitiveExpression(true, serial),
            );
          }
        }
        default:
          return makeUnaryExpression(
            node.operator,
            deconstructExpression(node.argument, context, null),
            serial,
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        deconstructExpression(node.left, context, null),
        deconstructExpression(node.right, context, null),
        serial,
      );
    case "AwaitExpression":
      return makeAwaitExpression(
        deconstructExpression(node.argument, context, null),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        node.argument == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : deconstructExpression(node.argument, context, null),
        serial,
      );
    default:
      throw new StaticError("invalid estree expression node", node);
  }
};
