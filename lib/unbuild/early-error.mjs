import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { makeEffectStatement, makeExpressionEffect } from "./node.mjs";
import { makeEarlyErrorPrelude } from "./prelude.mjs";
import { initSequence, mapSequence } from "./sequence.mjs";

/**
 * @type {<X>(
 *  value: X,
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   X,
 * >}
 */
export const makeEarlyError = (value, message, path) =>
  initSequence([makeEarlyErrorPrelude({ message, path })], value);

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeEarlyErrorExpression = (message, path) =>
  initSequence(
    [makeEarlyErrorPrelude({ message, path })],
    makeThrowErrorExpression("SyntaxError", message, path),
  );

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listEarlyErrorEffect = (message, path) =>
  mapSequence(makeEarlyErrorExpression(message, path), (node) => [
    makeExpressionEffect(node, path),
  ]);

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const listEarlyErrorStatement = (message, path) =>
  mapSequence(makeEarlyErrorExpression(message, path), (node) => [
    makeEffectStatement(makeExpressionEffect(node, path), path),
  ]);
