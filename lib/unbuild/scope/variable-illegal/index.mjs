import { hasOwn } from "../../../util/index.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";

/**
 * @type {(
 *   record: {[k in estree.Variable]?: string},
 * ) => import(".").IllegalFrame}
 */
export const makeIllegalFrame = (record) => ({
  type: "illegal",
  record,
});

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").IllegalFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => null | import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeIllegalLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeEarlyErrorExpression(
      `Variable '${operation.variable}' is illegal in ${
        frame.record[operation.variable]
      }`,
      path,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").IllegalFrame,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => null | import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listIllegalSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listEarlyErrorEffect(
      `Variable '${operation.variable}' is illegal in ${
        frame.record[operation.variable]
      }`,
      path,
    );
  } else {
    return null;
  }
};
