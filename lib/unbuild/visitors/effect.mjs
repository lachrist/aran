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
import {
  unbuildExpression,
  unbuildNameExpression,
  unbuildVariableNameExpression,
} from "./expression.mjs";
import { unbuildWritePatternEffect } from "./pattern.mjs";
import { unbuildUpdateLeft } from "./update.mjs";
import { drill, drillArray } from "../site.mjs";
import { isNameSite } from "../predicate.mjs";
import { splitMeta } from "../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  makeConvertNumberExpression,
  makeOneExpression,
  toAssignmentBinaryOperator,
  toUpdateBinaryOperator,
} from "../update.mjs";
import { bindSequence, listenSequence, tellSequence } from "../sequence.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
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
              /** @type {import("../site.d.ts").Site<estree.Expression>} */ (
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
        return listenSequence(
          bindSequence(
            unbuildUpdateLeft(sites.left, context, {
              right: sites.right,
            }),
            ({ name, old_value, update }) => {
              const proceed = () =>
                update(
                  context,
                  name === null
                    ? unbuildExpression(sites.right, context, {})
                    : unbuildVariableNameExpression(sites.right, context, {
                        name,
                      }),
                );
              switch (node.operator) {
                case "??=": {
                  return tellSequence([
                    makeConditionalEffect(
                      makeBinaryExpression(
                        "==",
                        old_value,
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      proceed(),
                      [],
                      path,
                    ),
                  ]);
                }
                case "||=": {
                  return tellSequence([
                    makeConditionalEffect(old_value, [], proceed(), path),
                  ]);
                }
                case "&&=": {
                  return tellSequence([
                    makeConditionalEffect(old_value, proceed(), [], path),
                  ]);
                }
                default: {
                  return tellSequence(
                    update(
                      context,
                      makeBinaryExpression(
                        toAssignmentBinaryOperator(node.operator),
                        old_value,
                        unbuildExpression(sites.right, context, {}),
                        path,
                      ),
                    ),
                  );
                }
              }
            },
          ),
        );
      }
    }
    case "UpdateExpression": {
      const metas = splitMeta(meta, [
        "drill",
        "update",
        "raw_old_value",
        "old_value",
      ]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return listenSequence(
        bindSequence(
          unbuildUpdateLeft(sites.argument, context, {}),
          ({ old_value: raw_old_value, update }) =>
            bindSequence(
              cacheConstant(metas.raw_old_value, raw_old_value, path),
              (raw_old_value) =>
                bindSequence(
                  cacheConstant(
                    metas.old_value,
                    makeConvertNumberExpression(raw_old_value, path),
                    path,
                  ),
                  (old_value) =>
                    tellSequence(
                      update(
                        context,
                        makeBinaryExpression(
                          toUpdateBinaryOperator(node.operator),
                          makeReadCacheExpression(old_value, path),
                          makeOneExpression(
                            makeReadCacheExpression(old_value, path),
                            path,
                          ),
                          path,
                        ),
                      ),
                    ),
                ),
            ),
        ),
      );
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
