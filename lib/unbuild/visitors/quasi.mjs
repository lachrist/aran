import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   node: import("../../estree").TemplateElement,
 *   meta: import("../meta").Meta,
 *   options: import("../context").Context & {
 *     cooked: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   never,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildQuasi = (node, _meta, { digest, cooked }) => {
  const hash = digest(node);
  if (cooked) {
    if (node.value.cooked == null) {
      return zeroSequence(makeIntrinsicExpression("undefined", hash));
    } else {
      return zeroSequence(makePrimitiveExpression(node.value.cooked, hash));
    }
  } else {
    return zeroSequence(makePrimitiveExpression(node.value.raw, hash));
  }
};
