import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").TemplateElement<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   never,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildQuasi = (node, _meta, _scope, { cooked }) => {
  const { _hash: hash } = node;
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
