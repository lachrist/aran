/**
 * @type {(
 *   test: import("../atom").Expression,
 *   exit: import("../atom").Expression,
 * ) => import("./condition").Condition}
 */
export const makeCondition = (test, exit) => ({
  test,
  exit,
});
