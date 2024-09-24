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
  hash,
  meta,
  _frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (operation.type === "read-error") {
    return zeroSequence(makeReadExpression("catch.error", hash));
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").CatchFrame
 * >}
 */
export const listCatchSaveEffect = (
  hash,
  meta,
  _frame,
  operation,
  alternate,
  context,
) => alternate(hash, meta, context, operation);
