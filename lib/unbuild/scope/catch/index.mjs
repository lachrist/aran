import { makeReadExpression } from "../../node.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").CatchFrame,
 *   operation: import("..").CatchLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeCatchLoadExpression = ({ path }, _frame, _operation) =>
  makeReadExpression("catch.error", path);
