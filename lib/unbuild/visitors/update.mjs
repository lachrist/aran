import {
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
  makeLongSequenceExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { unbuildUpdateMember } from "./member.mjs";
import { listSetMemberEffect, makeSetMemberExpression } from "../member.mjs";

/**
 * @type {(
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeUpdateValueExpression = (operator, left, right, { path, meta }) => {
  switch (operator) {
    case "??": {
      return makeInitCacheExpression("constant", left, { path, meta }, (left) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadCacheExpression(left, path),
            makePrimitiveExpression(null, path),
            path,
          ),
          right ?? makePrimitiveExpression({ undefined: null }, path),
          makeReadCacheExpression(left, path),
          path,
        ),
      );
    }
    case "||": {
      return makeInitCacheExpression("constant", left, { path, meta }, (left) =>
        makeConditionalExpression(
          makeReadCacheExpression(left, path),
          makeReadCacheExpression(left, path),
          right ?? makePrimitiveExpression(false, path),
          path,
        ),
      );
    }
    case "&&": {
      return makeInitCacheExpression("constant", left, { path, meta }, (left) =>
        makeConditionalExpression(
          makeReadCacheExpression(left, path),
          right ?? makePrimitiveExpression(true, path),
          makeReadCacheExpression(left, path),
          path,
        ),
      );
    }
    default: {
      return right === null
        ? makeInitCacheExpression("constant", left, { path, meta }, (left) =>
            makeBinaryExpression(
              operator,
              makeReadCacheExpression(left, path),
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeUnaryExpression(
                    "typeof",
                    makeReadCacheExpression(left, path),
                    path,
                  ),
                  makePrimitiveExpression("bigint", path),
                  path,
                ),
                makePrimitiveExpression({ bigint: "1" }, path),
                makePrimitiveExpression(1, path),
                path,
              ),
              path,
            ),
          )
        : makeBinaryExpression(operator, left, right, path);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     prefix: boolean,
 *     update: aran.Expression<unbuild.Atom> | null,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateExpression = (
  { node, path, meta },
  context,
  { update, prefix, operator },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return makeLongSequenceExpression(
        unbuildEffect({ node, path, meta }, context, {}),
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          path,
        ),
        path,
      );
    }
    case "MemberExpression": {
      const metas = splitMeta(meta, ["member", "update", "value"]);
      return unbuildUpdateMember({ node, path, meta: metas.member }, context, {
        kontinue: (setup, object, key, value) => {
          if (prefix) {
            return makeSetMemberExpression(
              context,
              object,
              key,
              makeUpdateValueExpression(operator, value, update, {
                path,
                meta: metas.update,
              }),
              { path, meta: metas.value },
            );
          } else {
            return makeLongSequenceExpression(
              setup,
              makeInitCacheExpression(
                "constant",
                value,
                { path, meta: metas.value },
                (value) =>
                  makeLongSequenceExpression(
                    listSetMemberEffect(
                      context,
                      object,
                      key,
                      makeUpdateValueExpression(
                        operator,
                        makeReadCacheExpression(value, path),
                        update,
                        {
                          path,
                          meta: metas.update,
                        },
                      ),
                      { path, meta: metas.member },
                    ),
                    makeReadCacheExpression(value, path),
                    path,
                  ),
              ),
              path,
            );
          }
        },
      });
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["update", "write", "result"]);
      if (prefix) {
        return makeInitCacheExpression(
          "constant",
          makeUpdateValueExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
            update,
            { path, meta: metas.update },
          ),
          { path, meta: metas.result },
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeReadCacheExpression(result, path),
                path,
                metas.write,
              ),
              makeReadCacheExpression(result, path),
              path,
            ),
        );
      } else {
        return makeInitCacheExpression(
          "constant",
          makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            path,
          ),
          { path, meta: metas.result },
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeUpdateValueExpression(
                  operator,
                  makeReadCacheExpression(result, path),
                  update,
                  { path, meta: metas.update },
                ),
                path,
                metas.write,
              ),
              makeReadCacheExpression(result, path),
              path,
            ),
        );
      }
    }
    default: {
      return makeSyntaxErrorExpression(
        "Invalid left-hand side in assignment",
        path,
      );
    }
  }
};

/**
 * @type {(
 *   site: {
 *     node: estree.Pattern | estree.Expression,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     update: aran.Expression<unbuild.Atom> | null,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *   }
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateEffect = (
  { node, path, meta },
  context,
  { update, operator },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return [
        ...unbuildEffect({ node, path, meta }, context, {}),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "ReferenceError",
            "Invalid left-hand side in assignment",
            path,
          ),
          path,
        ),
      ];
    }
    case "MemberExpression": {
      const metas = splitMeta(meta, ["drill", "update", "set"]);
      return unbuildUpdateMember({ node, path, meta: metas.drill }, context, {
        kontinue: (setup, object, key, value) => [
          ...setup,
          ...listSetMemberEffect(
            context,
            object,
            key,
            makeUpdateValueExpression(operator, value, update, {
              path,
              meta: metas.update,
            }),
            { path, meta: metas.set },
          ),
        ],
      });
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["update", "write"]);
      return [
        ...listScopeWriteEffect(
          context,
          /** @type {estree.Variable} */ (node.name),
          makeUpdateValueExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
            update,
            { path, meta: metas.update },
          ),
          path,
          metas.write,
        ),
      ];
    }
    default: {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression(
            "Invalid left-hand side in assignment",
            path,
          ),
          path,
        ),
      ];
    }
  }
};
