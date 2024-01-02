import { makeReadParameterExpression } from "../../node.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").BlockFrame,
 *   operation: import("..").BlockLoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeBlockLoadExpression = ({ path }, frame, _operation) => {
  if (frame.kind === "catch") {
    return makeReadParameterExpression("catch.error", path);
  } else {
    return null;
  }
};
