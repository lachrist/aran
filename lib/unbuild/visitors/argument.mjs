import { every, map } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { isNotSpreadElementSite } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";

/**
 * @typedef {{
 *   type: "spread",
 *   values: aran.Expression<unbuild.Atom>[],
 * } | {
 *   type: "concat",
 *   value: aran.Expression<unbuild.Atom>,
 * }} ArgumentList
 */

/**
 * @type {(
 *   sites: import("../site.mjs").Site<(
 *     | estree.Expression
 *     | estree.SpreadElement
 *   )>[],
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     path: unbuild.Path,
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         argument_list: ArgumentList,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildArgumentList = (sites, context, { path, kontinue }) => {
  if (every(sites, isNotSpreadElementSite)) {
    return kontinue(context, {
      argument_list: {
        type: "spread",
        values: map(sites, (site) => unbuildExpression(site, context, {})),
      },
    });
  } else {
    return kontinue(context, {
      argument_list: {
        type: "concat",
        value: makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          map(sites, (site) => unbuildSpreadable(site, context, {})),
          path,
        ),
      },
    });
  }
};
