import {
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeThrowErrorExpression,
  makeLongSequenceExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
  makeScopeGetSuperExpression,
  makeScopeSetSuperExpression,
  listScopeSetSuperEffect,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill } from "../../drill.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import {
  listCacheEffect,
  listRecordCacheEffect,
  makeCacheExpression,
  makeRecordCacheExpression,
} from "../cache.mjs";

/**
 * @type {(
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeUpdateValueExpression = (operator, left, right, path, meta) => {
  switch (operator) {
    case "??": {
      return makeCacheExpression(left, path, meta, (left) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            left,
            makePrimitiveExpression(null, path),
            path,
          ),
          right ?? makePrimitiveExpression({ undefined: null }, path),
          left,
          path,
        ),
      );
    }
    case "||": {
      return makeCacheExpression(left, path, meta, (left) =>
        makeConditionalExpression(
          left,
          left,
          right ?? makePrimitiveExpression(false, path),
          path,
        ),
      );
    }
    case "&&": {
      return makeCacheExpression(left, path, meta, (left) =>
        makeConditionalExpression(
          left,
          right ?? makePrimitiveExpression(true, path),
          left,
          path,
        ),
      );
    }
    default: {
      return right === null
        ? makeCacheExpression(left, path, meta, (left) =>
            makeBinaryExpression(
              operator,
              left,
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeUnaryExpression("typeof", left, path),
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
 *   pair: {
 *     node: estree.Pattern | estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     prefix: boolean,
 *     update: aran.Expression<unbuild.Atom> | null,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateExpression = (
  { node, path },
  context,
  { update, prefix, operator, meta },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return makeLongSequenceExpression(
        unbuildEffect({ node, path }, context, { meta }),
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          path,
        ),
        path,
      );
    }
    case "MemberExpression": {
      if (node.optional) {
        return makeSyntaxErrorExpression("Invalid optional chaning", path);
      }
      if (isNotSuperMemberExpression(node)) {
        if (prefix) {
          const metas = splitMeta(meta, [
            "cache",
            "object",
            "property",
            "update",
          ]);
          return makeRecordCacheExpression(
            {
              object: unbuildExpression(
                drill({ node, path }, "object"),
                context,
                {
                  meta: metas.object,
                  name: ANONYMOUS,
                },
              ),
              key: unbuildKeyExpression(
                drill({ node, path }, "property"),
                context,
                {
                  computed: node.computed,
                  meta: metas.property,
                },
              ),
            },
            path,
            metas.cache,
            ({ object, key }) =>
              makeSetExpression(
                context.strict,
                object,
                key,
                makeUpdateValueExpression(
                  operator,
                  makeGetExpression(object, key, path),
                  update,
                  path,
                  metas.update,
                ),
                path,
              ),
          );
        } else {
          const metas = splitMeta(meta, [
            "cache",
            "result",
            "object",
            "property",
            "update",
          ]);
          return makeRecordCacheExpression(
            {
              object: unbuildExpression(
                drill({ node, path }, "object"),
                context,
                {
                  meta: metas.object,
                  name: ANONYMOUS,
                },
              ),
              key: unbuildKeyExpression(
                drill({ node, path }, "property"),
                context,
                {
                  computed: node.computed,
                  meta: metas.property,
                },
              ),
            },
            path,
            metas.cache,
            ({ object, key }) =>
              makeCacheExpression(
                makeGetExpression(object, key, path),
                path,
                metas.result,
                (result) =>
                  makeSequenceExpression(
                    makeExpressionEffect(
                      makeSetExpression(
                        context.strict,
                        object,
                        key,
                        makeUpdateValueExpression(
                          operator,
                          result,
                          update,
                          path,
                          metas.update,
                        ),
                        path,
                      ),
                      path,
                    ),
                    result,
                    path,
                  ),
              ),
          );
        }
      } else {
        if (prefix) {
          const metas = splitMeta(meta, ["key", "property", "update", "super"]);
          return makeCacheExpression(
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.property,
              computed: node.computed,
            }),
            path,
            metas.key,
            (key) =>
              makeScopeSetSuperExpression(
                context,
                key,
                makeUpdateValueExpression(
                  operator,
                  makeScopeGetSuperExpression(context, key, path),
                  update,
                  path,
                  metas.update,
                ),
                path,
                metas.super,
              ),
          );
        } else {
          const metas = splitMeta(meta, ["key", "property", "old", "update"]);
          return makeCacheExpression(
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.property,
              computed: node.computed,
            }),
            path,
            metas.key,
            (key) =>
              makeCacheExpression(
                makeScopeGetSuperExpression(context, key, path),
                path,
                metas.old,
                (old) =>
                  makeLongSequenceExpression(
                    listScopeSetSuperEffect(
                      context,
                      key,
                      makeUpdateValueExpression(
                        operator,
                        old,
                        update,
                        path,
                        metas.update,
                      ),
                      path,
                    ),
                    old,
                    path,
                  ),
              ),
          );
        }
      }
    }
    case "Identifier": {
      if (prefix) {
        const metas = splitMeta(meta, ["result", "update", "write"]);
        return makeCacheExpression(
          makeUpdateValueExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
            update,
            path,
            metas.update,
          ),
          path,
          metas.result,
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                result,
                path,
                metas.write,
              ),
              result,
              path,
            ),
        );
      } else {
        const metas = splitMeta(meta, ["result", "update", "write"]);
        return makeCacheExpression(
          makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            path,
          ),
          path,
          metas.result,
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeUpdateValueExpression(
                  operator,
                  result,
                  update,
                  path,
                  metas.update,
                ),
                path,
                metas.write,
              ),
              result,
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
 *   pair: {
 *     node: estree.Pattern | estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     update: aran.Expression<unbuild.Atom> | null,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     meta: unbuild.Meta,
 *   }
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateEffect = (
  { node, path },
  context,
  { update, operator, meta },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return [
        ...unbuildEffect({ node, path }, context, { meta }),
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
      if (node.optional) {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression("Invalid optional chaning", path),
            path,
          ),
        ];
      }
      if (isNotSuperMemberExpression(node)) {
        const metas = splitMeta(meta, [
          "object",
          "property",
          "cache",
          "update",
        ]);
        return listRecordCacheEffect(
          {
            object: unbuildExpression(
              drill({ node, path }, "object"),
              context,
              {
                meta: metas.object,
                name: ANONYMOUS,
              },
            ),
            key: unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              {
                meta: metas.property,
                computed: node.computed,
              },
            ),
          },
          path,
          metas.cache,
          ({ object, key }) => [
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                object,
                key,
                makeUpdateValueExpression(
                  operator,
                  makeGetExpression(object, key, path),
                  update,
                  path,
                  metas.update,
                ),
                path,
              ),
              path,
            ),
          ],
        );
      } else {
        const metas = splitMeta(meta, ["property", "key", "update"]);
        return listCacheEffect(
          unbuildKeyExpression(drill({ node, path }, "property"), context, {
            meta: metas.property,
            computed: node.computed,
          }),
          path,
          metas.key,
          (key) =>
            listScopeSetSuperEffect(
              context,
              key,
              makeUpdateValueExpression(
                operator,
                makeScopeGetSuperExpression(context, key, path),
                update,
                path,
                metas.update,
              ),
              path,
            ),
        );
      }
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
            path,
            metas.update,
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
