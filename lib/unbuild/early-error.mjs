import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { makeEffectStatement, makeExpressionEffect } from "./node.mjs";
import { makeEarlyErrorPrelude } from "./prelude.mjs";
import { prependSequence } from "./sequence.mjs";

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => aran.Statement<unbuild.Atom>}
 */
export const makeEarlyErrorStatement = (error) => {
  if (error.guard === null) {
    return {
      type: "EffectStatement",
      inner: {
        type: "ExpressionEffect",
        discard: {
          type: "ApplyExpression",
          callee: {
            type: "IntrinsicExpression",
            intrinsic: "aran.throw",
            tag: error.path,
          },
          this: {
            type: "PrimitiveExpression",
            primitive: { undefined: null },
            tag: error.path,
          },
          arguments: [
            {
              type: "ConstructExpression",
              callee: {
                type: "IntrinsicExpression",
                intrinsic: "SyntaxError",
                tag: error.path,
              },
              arguments: [
                {
                  type: "PrimitiveExpression",
                  primitive: error.message,
                  tag: error.path,
                },
              ],
              tag: error.path,
            },
          ],
          tag: error.path,
        },
        tag: error.path,
      },
      tag: error.path,
    };
  } else {
    return {
      type: "EffectStatement",
      inner: {
        type: "ConditionalEffect",
        condition: error.guard,
        positive: [
          {
            type: "ExpressionEffect",
            discard: {
              type: "ApplyExpression",
              callee: {
                type: "IntrinsicExpression",
                intrinsic: "aran.throw",
                tag: error.path,
              },
              this: {
                type: "PrimitiveExpression",
                primitive: { undefined: null },
                tag: error.path,
              },
              arguments: [
                {
                  type: "ConstructExpression",
                  callee: {
                    type: "IntrinsicExpression",
                    intrinsic: "SyntaxError",
                    tag: error.path,
                  },
                  arguments: [
                    {
                      type: "PrimitiveExpression",
                      primitive: error.message,
                      tag: error.path,
                    },
                  ],
                  tag: error.path,
                },
              ],
              tag: error.path,
            },
            tag: error.path,
          },
        ],
        negative: [],
        tag: error.path,
      },
      tag: error.path,
    };
  }
};

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeEarlyErrorExpression = (message, path) =>
  prependSequence(
    [
      makeEarlyErrorPrelude({
        guard: null,
        message,
        path,
      }),
    ],
    makeThrowErrorExpression("SyntaxError", message, path),
  );

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const listEarlyErrorEffect = (message, path) =>
  makeExpressionEffect(makeEarlyErrorExpression(message, path), path);

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const listEarlyErrorStatement = (message, path) =>
  makeEffectStatement(listEarlyErrorEffect(message, path), path);
