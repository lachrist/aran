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
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { splitMeta, zipMeta } from "../mangle.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildEffect = ({ node, path }, context, { meta }) => {
  switch (node.type) {
    case "AssignmentExpression": {
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return [
            ...unbuildEffect(
              drill(
                // eslint-disable-next-line object-shorthand
                { node: /** @type {{left: estree.Expression}} */ (node), path },
                "left",
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
          const metas = splitMeta(meta, ["left", "right"]);
          return unbuildPatternEffect(drill({ node, path }, "left"), context, {
            meta: metas.left,
            right: unbuildNameExpression(
              drill({ node, path }, "right"),
              context,
              {
                meta: metas.right,
                name: makePrimitiveExpression(
                  node.left.type === "Identifier" ? node.left.name : "",
                  path,
                ),
              },
            ),
          });
        }
      } else {
        const metas = splitMeta(meta, ["left", "right"]);
        return unbuildUpdateEffect(drill({ node, path }, "left"), context, {
          meta: metas.left,
          update: unbuildExpression(drill({ node, path }, "right"), context, {
            meta: metas.right,
          }),
          operator:
            /** @type {estree.BinaryOperator | estree.LogicalOperator} */ (
              apply(sliceString, node.operator, [0, -1])
            ),
        });
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateEffect(drill({ node, path }, "argument"), context, {
        meta,
        update: null,
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
      });
    }
    case "SequenceExpression": {
      return flatMap(
        zipMeta(meta, drillAll(drillArray({ node, path }, "expressions"))),
        ([meta, pair]) => unbuildEffect(pair, context, { meta }),
      );
    }
    case "ConditionalExpression": {
      const metas = splitMeta(meta, ["test", "consequent", "alternate"]);
      return [
        makeConditionalEffect(
          unbuildExpression(drill({ node, path }, "test"), context, {
            meta: metas.test,
          }),
          unbuildEffect(drill({ node, path }, "consequent"), context, {
            meta: metas.consequent,
          }),
          unbuildEffect(drill({ node, path }, "alternate"), context, {
            meta: metas.alternate,
          }),
          path,
        ),
      ];
    }
    case "LogicalExpression": {
      const metas = splitMeta(meta, ["left", "right"]);
      switch (node.operator) {
        case "&&": {
          return [
            makeConditionalEffect(
              unbuildExpression(drill({ node, path }, "left"), context, {
                meta: metas.left,
              }),
              unbuildEffect(drill({ node, path }, "right"), context, {
                meta: metas.right,
              }),
              [],
              path,
            ),
          ];
        }
        case "||": {
          return [
            makeConditionalEffect(
              unbuildExpression(drill({ node, path }, "left"), context, {
                meta: metas.left,
              }),
              [],
              unbuildEffect(drill({ node, path }, "right"), context, {
                meta: metas.right,
              }),
              path,
            ),
          ];
        }
        case "??": {
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                unbuildExpression(drill({ node, path }, "left"), context, {
                  meta: metas.left,
                }),
                makePrimitiveExpression(null, path),
                path,
              ),
              unbuildEffect(drill({ node, path }, "right"), context, {
                meta: metas.right,
              }),
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
          unbuildExpression({ node, path }, context, { meta }),
          path,
        ),
      ];
    }
  }
};
