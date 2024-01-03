import { makeReadExpression } from "../../node.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").BlockFrame,
 *   operation: import("..").BlockLoadOperation,
 * ) => import("../../sequence").ExpressionSequence | null}
 */
export const makeBlockLoadExpression = ({ path }, frame, _operation) => {
  if (frame.kind === "catch") {
    return makeReadExpression("catch.error", path);
  } else {
    return null;
  }
};
