import { makeReadExpression } from "../../node.mjs";
import { zeroSequence } from "../../sequence.mjs";

/**
 * @type {import(".").CatchFrame}
 */
export const CATCH_FRAME = { type: "catch" };

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
  zeroSequence(makeReadExpression("catch.error", path));
