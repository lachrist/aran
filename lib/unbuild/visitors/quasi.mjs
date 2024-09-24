import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../../sequence.mjs";
import { digest } from "../annotation/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").TemplateElement,
 *   meta: import("../meta").Meta,
 *   options: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *     cooked: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   never,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildQuasi = (node, _meta, { annotation, cooked }) => {
  const hash = digest(node, annotation);
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
