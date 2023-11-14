import { AranTypeError, flatMap } from "../../util/index.mjs";
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
import { unbuildPatternEffect } from "./pattern.mjs";
import { unbuildUpdateEffect } from "./update.mjs";
import { drill, drillArray } from "../site.mjs";
import { isNameSite } from "../predicate.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

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
          return unbuildPatternEffect(sites.left, context, {
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
        return unbuildUpdateEffect(sites.left, context, {
          update: unbuildExpression(sites.right, context, {}),
          operator:
            /** @type {estree.BinaryOperator | estree.LogicalOperator} */ (
              apply(sliceString, node.operator, [0, -1])
            ),
        });
      }
    }
    case "UpdateExpression": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return unbuildUpdateEffect(sites.argument, context, {
        update: null,
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
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
