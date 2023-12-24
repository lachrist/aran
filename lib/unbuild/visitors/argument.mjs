import { every, mapIndex } from "../../util/index.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { drillSite } from "../site.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   node: estree.Expression | estree.SpreadElement,
 * ) => node is estree.Expression}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<(
 *     | estree.Expression
 *     | estree.SpreadElement
 *   )[]>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("./argument.d.ts").ArgumentList}
 */
export const unbuildArgumentList = ({ node, path, meta }, scope, _options) => {
  if (every(node, isNotSpreadElement)) {
    return {
      type: "spread",
      values: mapIndex(node.length, (index) =>
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
          scope,
          null,
        ),
      ),
    };
  } else {
    return {
      type: "concat",
      value: makeApplyExpression(
        makeIntrinsicExpression("Array.prototype.concat", path),
        makeArrayExpression([], path),
        mapIndex(node.length, (index) =>
          unbuildSpreadable(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
            scope,
            null,
          ),
        ),
        path,
      ),
    };
  }
};
