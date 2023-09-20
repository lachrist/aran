import { DynamicError } from "../../util/index.mjs";

import {
  makeApplyExpression,
  makeAwaitExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
  makeYieldExpression,
} from "../node.mjs";

import {
  makeBinaryExpression,
  makeDeleteExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";

import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/inner/index.mjs";

import { makeLongSequenceExpression } from "../sequence.mjs";

import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";

import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateExpression } from "./update.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { StaticSyntaxAranError } from "../../error.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../../estree/index.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @basename */ "expression";

/** @type {(node: estree.Node) => estree.Node} */
const extractChain = (node) =>
  node.type === "ChainExpression" ? extractChain(node.expression) : node;

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.js").Context<S>,
 *   name: estree.Variable | null,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildExpression = (node, context, _name) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "ThisExpression":
      return makeReadExpression("this", serial);
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeReadExpression("new.target", serial);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeReadExpression("import.meta", serial);
      } else {
        throw new DynamicError("invalid meta property", node);
      }
    case "Literal":
      if (isRegExpLiteral(node)) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(node.regex.pattern, serial),
            makePrimitiveExpression(node.regex.flags, serial),
          ],
          serial,
        );
      } else if (isBigIntLiteral(node)) {
        return makePrimitiveExpression({ bigint: node.bigint }, serial);
      } else {
        return makePrimitiveExpression(node.value, serial);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
        serial,
      );
    case "AssignmentExpression":
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return makeLongSequenceExpression(
            unbuildEffect(
              /** @type {estree.Expression} */ (node.left),
              context,
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              serial,
            ),
            serial,
          );
        } else {
          const right = {
            var: mangleMetaVariable(hash, BASENAME, "right"),
            val: unbuildExpression(node.right, context, null),
          };
          return makeLongSequenceExpression(
            [
              makeWriteEffect(right.var, right.val, serial, true),
              ...unbuildPatternEffect(node.left, context, right.var),
            ],
            makeReadExpression(right.var, serial),
            serial,
          );
        }
      } else {
        return unbuildUpdateExpression(node.left, context, {
          update: unbuildExpression(node.right, context, null),
          prefix: true,
          operator: /** @type {estree.BinaryOperator} */ (
            apply(sliceString, node.operator, [0, -1])
          ),
          serial,
          hash,
        });
      }
    case "UpdateExpression":
      return unbuildUpdateExpression(node.argument, context, {
        update: makePrimitiveExpression(1, serial),
        prefix: node.prefix,
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
        serial,
        hash,
      });
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context,
                /** @type {estree.Variable} */ (node.argument.name),
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
              return makeLongSequenceExpression(
                unbuildKeyEffect(argument.property, context, argument),
                makeThrowErrorExpression(
                  "ReferenceError",
                  "Unsupported reference to 'super'",
                  serial,
                ),
                serial,
              );
            } else {
              return makeDeleteExpression(
                context.strict,
                unbuildExpression(argument.object, context, null),
                unbuildKeyExpression(argument.property, context, argument),
                serial,
              );
            }
          } else {
            return makeLongSequenceExpression(
              unbuildEffect(node, context),
              makePrimitiveExpression(true, serial),
              serial,
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
      throw new StaticSyntaxAranError(BASENAME, node);
  }
};
