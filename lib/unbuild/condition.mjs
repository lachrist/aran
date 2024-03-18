/**
 * @type {(
 *   test: aran.Expression<unbuild.Atom>,
 *   exit: aran.Expression<unbuild.Atom>,
 * ) => import("./condition").Condition}
 */
export const makeCondition = (test, exit) => ({
  test,
  exit,
});
