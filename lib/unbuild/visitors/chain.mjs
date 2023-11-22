import { every, map, mapObject } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { isNotSpreadElementSite } from "../predicate.mjs";
import { drill, drillArray } from "../site.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainMember } from "./member.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     kontinue: (
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainElement = (
  { node, path, meta },
  context,
  { kontinue },
) => {
  switch (node.type) {
    case "MemberExpression": {
      return unbuildChainMember({ node, path, meta }, context, {
        object: false,
        kontinue: (_object, node) => kontinue(node),
      });
    }
    case "CallExpression": {
      const metas = splitMeta(meta, ["drill", "arguments"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["callee", "arguments"]),
        "arguments",
        drillArray,
      );
      // Optional eval call is not direct
      return unbuildChainCallee(sites.callee, context, {
        kontinue,
        optional: node.optional,
        arguments: every(sites.arguments, isNotSpreadElementSite)
          ? {
              type: "spread",
              values: map(sites.arguments, (site) =>
                unbuildExpression(site, context, {}),
              ),
            }
          : {
              type: "concat",
              value: makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.concat", path),
                makeArrayExpression([], path),
                map(sites.arguments, (site) =>
                  unbuildSpreadable(site, context, {}),
                ),
                path,
              ),
            },
      });
    }
    default: {
      return kontinue(unbuildExpression({ node, path, meta }, context, {}));
    }
  }
};
