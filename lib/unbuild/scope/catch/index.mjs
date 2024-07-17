import { makeReadExpression } from "../../node.mjs";
import { zeroSequence } from "../../../sequence.mjs";

/**
 * @type {import(".").CatchFrame}
 */
export const CATCH_FRAME = { type: "catch" };

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").CatchFrame
 * >}
 */
export const makeCatchLoadExpression = (
  site,
  _frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (operation.type === "read-error") {
    return zeroSequence(makeReadExpression("catch.error", site.path));
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").CatchFrame
 * >}
 */
export const listCatchSaveEffect = (
  site,
  _frame,
  operation,
  alternate,
  context,
) => alternate(site, context, operation);
