import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").TemplateElement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   never,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildQuasi = ({ node, path }, _scope, { cooked }) => {
  if (cooked) {
    if (node.value.cooked == null) {
      return zeroSequence(makeIntrinsicExpression("undefined", path));
    } else {
      return zeroSequence(makePrimitiveExpression(node.value.cooked, path));
    }
  } else {
    return zeroSequence(makePrimitiveExpression(node.value.raw, path));
  }
};
