import { makePrimitiveExpression } from "../node.mjs";
import { zeroSequence } from "../sequence.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.TemplateElement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildQuasi = ({ node, path }, _scope, { cooked }) =>
  zeroSequence(
    makePrimitiveExpression(
      cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
      path,
    ),
  );
