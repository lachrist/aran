import { mapTwoSequence } from "./sequence.mjs";

/**
 * @type {(
 *   test: import("./sequence").ExpressionSequence,
 *   exit: import("./sequence").ExpressionSequence,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").ExpressionPrelude,
 *   import("./condition").Condition,
 * >}
 */
export const wrapCondition = (test, exit) =>
  mapTwoSequence(test, exit, (test, exit) => ({
    test,
    exit,
  }));

/**
 * @type {(
 *   condition: import("./condition").Condition,
 *   next: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unwrapCondition = (condition, next, path) => ({
  type: "ConditionalExpression",
  test: condition.test,
  consequent: condition.exit,
  alternate: next,
  tag: path,
});
