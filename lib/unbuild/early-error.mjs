import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { makeEffectStatement, makeExpressionEffect } from "./node.mjs";
import { makeEarlyErrorPrelude } from "./prelude.mjs";
import { bindSequence, initSequence } from "./sequence.mjs";

/**
 * @type {<X>(
 *   value: X,
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   X,
 * >}
 */
export const reportEarlyError = (value, message, path) =>
  initSequence(
    [
      makeEarlyErrorPrelude({
        message,
        path,
      }),
    ],
    value,
  );

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeEarlyErrorExpression = (message, path) =>
  bindSequence(makeThrowErrorExpression("SyntaxError", message, path), (node) =>
    reportEarlyError(node, message, path),
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
