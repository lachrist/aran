import { every, map } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { isNotSpreadElementSite } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   sites: import("../site.d.ts").Site<(
 *     | estree.Expression
 *     | estree.SpreadElement
 *   )>[],
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => import("./argument.d.ts").ArgumentList}
 */
export const unbuildArgumentList = (sites, context, { path }) => {
  if (every(sites, isNotSpreadElementSite)) {
    return {
      type: "spread",
      values: map(sites, (site) => unbuildExpression(site, context, {})),
    };
  } else {
    return {
      type: "concat",
      value: makeApplyExpression(
        makeIntrinsicExpression("Array.prototype.concat", path),
        makeArrayExpression([], path),
        map(sites, (site) => unbuildSpreadable(site, context, {})),
        path,
      ),
    };
  }
};
