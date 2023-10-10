import { StaticError, flatMap } from "../../util/index.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeWriteEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { unbuildUpdateEffect } from "./update.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("effect");

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildEffect = ({ node, path }, context) => {
  switch (node.type) {
    case "AssignmentExpression": {
      const right = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("right"),
        path,
      );
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return [
            ...unbuildEffect(
              drill(
                // eslint-disable-next-line object-shorthand
                { node: /** @type {{left: estree.Expression}} */ (node), path },
                "left",
              ),
              context,
            ),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
              ),
            ),
          ];
        } else {
          return [
            makeWriteEffect(
              right,
              unbuildExpression(drill({ node, path }, "right"), context, {
                name:
                  node.left.type === "Identifier"
                    ? {
                        type: "static",
                        kind: "scope",
                        base: /** @type {estree.Variable} */ (node.left.type),
                      }
                    : ANONYMOUS,
              }),
              true,
            ),
            ...unbuildPatternEffect(drill({ node, path }, "left"), context, {
              right,
            }),
          ];
        }
      } else {
        return unbuildUpdateEffect(drill({ node, path }, "left"), context, {
          update: unbuildExpression(drill({ node, path }, "right"), context, {
            name: ANONYMOUS,
          }),
          operator: /** @type {estree.BinaryOperator} */ (
            apply(sliceString, node.operator, [0, -1])
          ),
        });
      }
    }
    case "UpdateExpression":
      return unbuildUpdateEffect(drill({ node, path }, "argument"), context, {
        update: makePrimitiveExpression(1),
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
      });
    case "SequenceExpression":
      return flatMap(
        drillAll(drillArray({ node, path }, "expressions")),
        (pair) => unbuildEffect(pair, context),
      );
    case "ConditionalExpression":
      return [
        makeConditionalEffect(
          unbuildExpression(drill({ node, path }, "test"), context, {
            name: ANONYMOUS,
          }),
          unbuildEffect(drill({ node, path }, "consequent"), context),
          unbuildEffect(drill({ node, path }, "alternate"), context),
        ),
      ];
    case "LogicalExpression":
      switch (node.operator) {
        case "&&":
          return [
            makeConditionalEffect(
              unbuildExpression(drill({ node, path }, "left"), context, {
                name: ANONYMOUS,
              }),
              unbuildEffect(drill({ node, path }, "right"), context),
              [],
            ),
          ];
        case "||":
          return [
            makeConditionalEffect(
              unbuildExpression(drill({ node, path }, "left"), context, {
                name: ANONYMOUS,
              }),
              [],
              unbuildEffect(drill({ node, path }, "right"), context),
            ),
          ];
        case "??":
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                unbuildExpression(drill({ node, path }, "left"), context, {
                  name: ANONYMOUS,
                }),
                makePrimitiveExpression(null),
              ),
              unbuildEffect(drill({ node, path }, "right"), context),
              [],
            ),
          ];
        default:
          throw new StaticError("invalid logical operator", node);
      }
    default:
      return [
        makeExpressionEffect(
          unbuildExpression({ node, path }, context, { name: ANONYMOUS }),
        ),
      ];
  }
};
