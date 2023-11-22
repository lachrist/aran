import {
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeSequenceExpression,
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
import { isNotOptionalMemberExpression } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice },
  },
} = globalThis;

const INCREMENT = {
  "++": /** @type {"+"} */ ("+"),
  "--": /** @type {"-"} */ ("-"),
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     operator: estree.UpdateOperator,
 *     left: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeUpdateRightExpression = (
  { path, meta },
  {},
  { operator, left },
) =>
  makeInitCacheExpression("constant", left, { path, meta }, (left) =>
    makeBinaryExpression(
      INCREMENT[operator],
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
  );

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     operator: estree.AssignmentOperator,
 *     left: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateRightExpression = (
  { node, path, meta },
  context,
  { operator, left },
) => {
  const metas = splitMeta(meta, ["unbuild", "left"]);
  switch (operator) {
    case "??=": {
      return makeInitCacheExpression(
        "constant",
        left,
        { path, meta: metas.left },
        (left) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeReadCacheExpression(left, path),
              makePrimitiveExpression(null, path),
              path,
            ),
            unbuildExpression({ node, path, meta: metas.unbuild }, context, {}),
            makeReadCacheExpression(left, path),
            path,
          ),
      );
    }
    case "||=": {
      return makeInitCacheExpression(
        "constant",
        left,
        { path, meta: metas.left },
        (left) =>
          makeConditionalExpression(
            makeReadCacheExpression(left, path),
            makeReadCacheExpression(left, path),
            unbuildExpression({ node, path, meta: metas.unbuild }, context, {}),
            path,
          ),
      );
    }
    case "&&=": {
      return makeInitCacheExpression(
        "constant",
        left,
        { path, meta: metas.left },
        (left) =>
          makeConditionalExpression(
            makeReadCacheExpression(left, path),
            unbuildExpression({ node, path, meta: metas.unbuild }, context, {}),
            makeReadCacheExpression(left, path),
            path,
          ),
      );
    }
    default: {
      return makeBinaryExpression(
        /** @type {estree.BinaryOperator} */ (apply(slice, operator, [0, -1])),
        left,
        unbuildExpression({ node, path, meta: metas.unbuild }, context, {}),
        path,
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     prefix: boolean,
 *     update: (
 *       context: import("../context.d.ts").Context,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateLeftExpression = (
  { node, path, meta },
  context,
  { update, prefix },
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
      if (isNotOptionalMemberExpression(node)) {
        const metas = splitMeta(meta, ["member", "update", "value"]);
        return unbuildUpdateMember(
          { node, path, meta: metas.member },
          context,
          {
            prepend: makeSequenceExpression,
            kontinue: (object, key, value) => {
              if (prefix) {
                return makeSetMemberExpression(
                  context,
                  object,
                  key,
                  update(context, value),
                  { path, meta: metas.value },
                );
              } else {
                return makeInitCacheExpression(
                  "constant",
                  value,
                  { path, meta: metas.value },
                  (value) =>
                    makeLongSequenceExpression(
                      listSetMemberEffect(
                        context,
                        object,
                        key,
                        update(context, makeReadCacheExpression(value, path)),
                        { path, meta: metas.member },
                      ),
                      makeReadCacheExpression(value, path),
                      path,
                    ),
                );
              }
            },
          },
        );
      } else {
        return makeSyntaxErrorExpression(
          "Invalid optional member in left-hand side",
          path,
        );
      }
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["update", "write", "result"]);
      if (prefix) {
        return makeInitCacheExpression(
          "constant",
          update(
            context,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
          ),
          { path, meta: metas.result },
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeReadCacheExpression(result, path),
                { path, meta: metas.write },
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
                update(context, makeReadCacheExpression(result, path)),
                { path, meta: metas.write },
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
 *   head: aran.Effect<unbuild.Atom>,
 *   tail: aran.Effect<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const prependEffect = (head, tail, _path) => [head, ...tail];

/**
 * @type {(
 *   site: {
 *     node: estree.Pattern | estree.Expression,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     update: (
 *       context: import("../context.d.ts").Context,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   }
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateLeftEffect = (
  { node, path, meta },
  context,
  { update },
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
      if (isNotOptionalMemberExpression(node)) {
        const metas = splitMeta(meta, ["drill", "update", "set"]);
        return unbuildUpdateMember({ node, path, meta: metas.drill }, context, {
          prepend: prependEffect,
          kontinue: (object, key, value) => [
            ...listSetMemberEffect(
              context,
              object,
              key,
              update(context, value),
              { path, meta: metas.set },
            ),
          ],
        });
      } else {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression(
              "Invalid optional member in left-hand side",
              path,
            ),
            path,
          ),
        ];
      }
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["update", "write"]);
      return [
        ...listScopeWriteEffect(
          context,
          /** @type {estree.Variable} */ (node.name),
          update(
            context,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
          ),
          { path, meta: metas.write },
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
