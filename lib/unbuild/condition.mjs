/**
 * @type {(
 *   test: aran.Expression<import("./atom").Atom>,
 *   exit: aran.Expression<import("./atom").Atom>,
 * ) => import("./condition").Condition}
 */
export const makeCondition = (test, exit) => ({
  test,
  exit,
});
