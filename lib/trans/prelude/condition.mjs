/**
 * @type {(
 *   test: import("../atom.d.ts").Expression,
 *   exit: import("../atom.d.ts").Expression,
 * ) => import("./condition.d.ts").Condition}
 */
export const makeCondition = (test, exit) => ({
  test,
  exit,
});
