import { makeReadExpression } from "../../node.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").CatchFrame,
 *   operation: import("../operation").CatchLoadOperation,
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 *  >}
 */
export const makeCatchLoadExpression = ({ path }, _frame, _operation) =>
  makeReadExpression("catch.error", path);
