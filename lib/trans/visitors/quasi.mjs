import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").TemplateElement<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   never,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transQuasi = (node, _meta, _scope, { cooked }) => {
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
