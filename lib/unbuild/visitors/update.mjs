import {
  makeConditionalEffect,
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
 *     old_value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeUpdateRightExpression = (
  { path, meta },
  {},
  { operator, old_value },
) =>
  makeInitCacheExpression("constant", old_value, { path, meta }, (old_value) =>
    makeBinaryExpression(
      INCREMENT[operator],
      makeReadCacheExpression(old_value, path),
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(old_value, path),
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
 *     old_value: aran.Expression<unbuild.Atom>,
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       new_value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateRightEffect = (
  { node, path, meta },
  context,
  { operator, old_value: value, kontinue },
) => {
  switch (operator) {
    case "??=": {
      return [
        makeConditionalEffect(
          makeBinaryExpression(
            "==",
            value,
            makePrimitiveExpression(null, path),
            path,
          ),
          kontinue(
            context,
            unbuildExpression({ node, path, meta }, context, {}),
          ),
          [],
          path,
        ),
      ];
    }
    case "||=": {
      return [
        makeConditionalEffect(
          value,
          [],
          kontinue(
            context,
            unbuildExpression({ node, path, meta }, context, {}),
          ),
          path,
        ),
      ];
    }
    case "&&=": {
      return [
        makeConditionalEffect(
          value,
          kontinue(
            context,
            unbuildExpression({ node, path, meta }, context, {}),
          ),
          [],
          path,
        ),
      ];
    }
    default: {
      return kontinue(
        context,
        makeBinaryExpression(
          /** @type {estree.BinaryOperator} */ (
            apply(slice, operator, [0, -1])
          ),
          value,
          unbuildExpression({ node, path, meta }, context, {}),
          path,
        ),
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     operator: estree.AssignmentOperator,
 *     old_value: aran.Expression<unbuild.Atom>,
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       new_value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateRightExpression = (
  { node, path, meta },
  context,
  { operator, old_value: value, kontinue },
) => {
  const metas = splitMeta(meta, ["unbuild", "value"]);
  switch (operator) {
    case "??=": {
      return makeInitCacheExpression(
        "constant",
        value,
        { path, meta: metas.value },
        (value) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeReadCacheExpression(value, path),
              makePrimitiveExpression(null, path),
              path,
            ),
            kontinue(
              context,
              unbuildExpression(
                { node, path, meta: metas.unbuild },
                context,
                {},
              ),
            ),
            makeReadCacheExpression(value, path),
            path,
          ),
      );
    }
    case "||=": {
      return makeInitCacheExpression(
        "constant",
        value,
        { path, meta: metas.value },
        (value) =>
          makeConditionalExpression(
            makeReadCacheExpression(value, path),
            makeReadCacheExpression(value, path),
            kontinue(
              context,
              unbuildExpression(
                { node, path, meta: metas.unbuild },
                context,
                {},
              ),
            ),
            path,
          ),
      );
    }
    case "&&=": {
      return makeInitCacheExpression(
        "constant",
        value,
        { path, meta: metas.value },
        (value) =>
          makeConditionalExpression(
            makeReadCacheExpression(value, path),
            kontinue(
              context,
              unbuildExpression(
                { node, path, meta: metas.unbuild },
                context,
                {},
              ),
            ),
            makeReadCacheExpression(value, path),
            path,
          ),
      );
    }
    default: {
      return kontinue(
        context,
        makeBinaryExpression(
          /** @type {estree.BinaryOperator} */ (
            apply(slice, operator, [0, -1])
          ),
          value,
          unbuildExpression({ node, path, meta: metas.unbuild }, context, {}),
          path,
        ),
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
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       old_value: aran.Expression<unbuild.Atom>,
 *       kontinue: (
 *         context: import("../context.d.ts").Context,
 *         new_value: aran.Expression<unbuild.Atom>,
 *       ) => aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateLeftExpression = (
  { node, path, meta },
  context,
  { prefix, kontinue },
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
        const metas = splitMeta(meta, ["member", "set", "old_value"]);
        return unbuildUpdateMember(
          { node, path, meta: metas.member },
          context,
          {
            prepend: makeSequenceExpression,
            kontinue: (object, key, old_value) => {
              if (prefix) {
                return kontinue(context, old_value, (context, value) =>
                  makeSetMemberExpression(context, object, key, value, {
                    path,
                    meta: metas.set,
                  }),
                );
              } else {
                return makeInitCacheExpression(
                  "constant",
                  old_value,
                  { path, meta: metas.old_value },
                  (old_value) =>
                    kontinue(
                      context,
                      makeReadCacheExpression(old_value, path),
                      (context, new_value) =>
                        makeLongSequenceExpression(
                          listSetMemberEffect(context, object, key, new_value, {
                            path,
                            meta: metas.set,
                          }),
                          makeReadCacheExpression(old_value, path),
                          path,
                        ),
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
      const metas = splitMeta(meta, ["write", "old_value", "new_value"]);
      if (prefix) {
        return kontinue(
          context,
          makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            path,
          ),
          (context, new_value) =>
            makeInitCacheExpression(
              "constant",
              new_value,
              { path, meta: metas.new_value },
              (new_value) =>
                makeLongSequenceExpression(
                  listScopeWriteEffect(
                    context,
                    /** @type {estree.Variable} */ (node.name),
                    makeReadCacheExpression(new_value, path),
                    { path, meta: metas.write },
                  ),
                  makeReadCacheExpression(new_value, path),
                  path,
                ),
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
          { path, meta: metas.old_value },
          (new_value) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeReadCacheExpression(new_value, path),
                { path, meta: metas.write },
              ),
              makeReadCacheExpression(new_value, path),
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
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       old_value: aran.Expression<unbuild.Atom>,
 *       kontinue: (
 *         context: import("../context.d.ts").Context,
 *         new_value: aran.Expression<unbuild.Atom>,
 *       ) => aran.Effect<unbuild.Atom>[],
 *     ) => aran.Effect<unbuild.Atom>[],
 *   }
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateLeftEffect = (
  { node, path, meta },
  context,
  { kontinue },
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
          kontinue: (object, key, old_value) =>
            kontinue(context, old_value, (context, new_value) =>
              listSetMemberEffect(context, object, key, new_value, {
                path,
                meta: metas.set,
              }),
            ),
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
      return kontinue(
        context,
        makeScopeReadExpression(
          context,
          /** @type {estree.Variable} */ (node.name),
          path,
        ),
        (context, new_value) =>
          listScopeWriteEffect(
            context,
            /** @type {estree.Variable} */ (node.name),
            new_value,
            { path, meta: metas.write },
          ),
      );
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
