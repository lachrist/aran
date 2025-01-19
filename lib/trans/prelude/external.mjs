import { EMPTY } from "../../util/index.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";

/**
 * @type {(
 *   duplicate: import("./external").ReifyExternal,
 * ) => import("../../util/tree").Tree<import("../atom").Statement>}
 */
export const listReifyExternalStatement = ({
  variable,
  origin,
  conflict_with_global_constant,
}) => {
  const message = `Duplicate variable: '${variable}' at ${origin}`;
  // Could also be options.base?
  const path = origin;
  return [
    makeEffectStatement(
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeIntrinsicExpression("aran.record", path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression("SyntaxError", message, path),
            path,
          ),
        ],
        EMPTY,
        path,
      ),
      path,
    ),
    conflict_with_global_constant
      ? makeEffectStatement(
          makeConditionalEffect(
            makeConditionalExpression(
              makeApplyExpression(
                // Reflect.getOwnPropertyDescriptor instead of Object.hasOwn
                // https://github.com/nodejs/node/issues/52720
                makeIntrinsicExpression(
                  "Reflect.getOwnPropertyDescriptor",
                  path,
                ),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.get", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression(
                      "Reflect.getOwnPropertyDescriptor",
                      path,
                    ),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeIntrinsicExpression("aran.global", path),
                      makePrimitiveExpression(variable, path),
                    ],
                    path,
                  ),
                  makePrimitiveExpression("configurable", path),
                ],
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            EMPTY,
            [
              makeExpressionEffect(
                makeThrowErrorExpression("SyntaxError", message, path),
                path,
              ),
            ],
            path,
          ),
          path,
        )
      : null,
  ];
};

/**
 * @type {(
 *   prelude: import("./index").Prelude,
 * ) => null | import("../../util/tree").Tree<import("../atom").Statement>}
 */
export const listPreludeReifyExternalStatement = (prelude) =>
  prelude.type === "external-reify"
    ? listReifyExternalStatement(prelude.data)
    : null;
