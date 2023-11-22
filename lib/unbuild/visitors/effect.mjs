import { flatMap } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildWritePatternEffect } from "./pattern.mjs";
import {
  makeUpdateRightExpression,
  unbuildUpdateLeftEffect,
  unbuildUpdateRightEffect,
} from "./update.mjs";
import { drill, drillArray } from "../site.mjs";
import { isNameSite } from "../predicate.mjs";
import { splitMeta } from "../mangle.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildEffect = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "AssignmentExpression": {
      const sites = drill({ node, path, meta }, ["left", "right"]);
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return [
            ...unbuildEffect(
              /** @type {import("../site.mjs").Site<estree.Expression>} */ (
                sites.left
              ),
              context,
              { meta },
            ),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
                path,
              ),
              path,
            ),
          ];
        } else {
          return unbuildWritePatternEffect(sites.left, context, {
            right: isNameSite(sites.right)
              ? unbuildNameExpression(sites.right, context, {
                  name: makePrimitiveExpression(
                    node.left.type === "Identifier" ? node.left.name : "",
                    path,
                  ),
                })
              : unbuildExpression(sites.right, context, {}),
          });
        }
      } else {
        return unbuildUpdateLeftEffect(sites.left, context, {
          kontinue: (context, old_value, kontinue) =>
            unbuildUpdateRightEffect(sites.right, context, {
              operator: node.operator,
              old_value,
              kontinue,
            }),
        });
      }
    }
    case "UpdateExpression": {
      const metas = splitMeta(meta, ["drill", "update"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return unbuildUpdateLeftEffect(sites.argument, context, {
        kontinue: (context, old_value, kontinue) =>
          kontinue(
            context,
            makeUpdateRightExpression({ path, meta: metas.update }, context, {
              operator: node.operator,
              old_value,
            }),
          ),
      });
    }
    case "SequenceExpression": {
      const sites = drill({ node, path, meta }, ["expressions"]);
      return flatMap(drillArray(sites.expressions), (site) =>
        unbuildEffect(site, context, { meta }),
      );
    }
    case "ConditionalExpression": {
      const sites = drill({ node, path, meta }, [
        "test",
        "consequent",
        "alternate",
      ]);
      return [
        makeConditionalEffect(
          unbuildExpression(sites.test, context, {}),
          unbuildEffect(sites.consequent, context, {}),
          unbuildEffect(sites.alternate, context, {}),
          path,
        ),
      ];
    }
    case "LogicalExpression": {
      const sites = drill({ node, path, meta }, ["left", "right"]);
      switch (node.operator) {
        case "&&": {
          return [
            makeConditionalEffect(
              unbuildExpression(sites.left, context, {}),
              unbuildEffect(sites.right, context, {}),
              [],
              path,
            ),
          ];
        }
        case "||": {
          return [
            makeConditionalEffect(
              unbuildExpression(sites.left, context, {}),
              [],
              unbuildEffect(sites.right, context, {}),
              path,
            ),
          ];
        }
        case "??": {
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                unbuildExpression(sites.left, context, {}),
                makePrimitiveExpression(null, path),
                path,
              ),
              unbuildEffect(sites.right, context, {}),
              [],
              path,
            ),
          ];
        }
        default: {
          throw new AranTypeError("invalid logical operator", node);
        }
      }
    }
    default: {
      return [
        makeExpressionEffect(
          unbuildExpression({ node, path, meta }, context, {}),
          path,
        ),
      ];
    }
  }
};
