import { makeThrowErrorExpression } from "./intrinsic.mjs";
import {
  makeConditionalEffect,
  makeExpressionEffect,
  tellEarlyError,
} from "./node.mjs";

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEarlyErrorEffect = (error) => {
  if (error.guard === null) {
    return [
      makeExpressionEffect(
        makeThrowErrorExpression("SyntaxError", error.message, error.path),
        error.path,
      ),
    ];
  } else {
    return [
      makeConditionalEffect(
        error.guard,
        [
          makeExpressionEffect(
            makeThrowErrorExpression("SyntaxError", error.message, error.path),
            error.path,
          ),
        ],
        [],
        error.path,
      ),
    ];
  }
};

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEarlyErrorExpression = (message, path) =>
  tellEarlyError(makeThrowErrorExpression("SyntaxError", message, path), {
    guard: null,
    message,
    path,
  });
