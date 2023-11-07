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
  listInitCacheEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
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
            "object",
            "property",
            "update",
            "object_cache",
            "property_cache",
          ]);
          return makeInitCacheExpression(
            "constant",
            unbuildExpression(drill({ node, path }, "object"), context, {
              meta: metas.object,
              name: ANONYMOUS,
            }),
            { path, meta: metas.object_cache },
            (object) =>
              makeInitCacheExpression(
                "constant",
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: metas.property,
                  },
                ),
                { path, meta: metas.property_cache },
                (property) =>
                  makeSetExpression(
                    context.strict,
                    makeReadCacheExpression(object, path),
                    makeReadCacheExpression(property, path),
                    makeUpdateValueExpression(
                      operator,
                      makeGetExpression(
                        makeReadCacheExpression(object, path),
                        makeReadCacheExpression(property, path),
                        path,
                      ),
                      update,
                      path,
                      metas.update,
                    ),
                    path,
                  ),
              ),
          );
        } else {
          const metas = splitMeta(meta, [
            "object",
            "property",
            "object_cache",
            "property_cache",
            "result_cache",
            "update",
          ]);
          return makeInitCacheExpression(
            "constant",
            unbuildExpression(drill({ node, path }, "object"), context, {
              meta: metas.object,
              name: ANONYMOUS,
            }),
            { path, meta: metas.object_cache },
            (object) =>
              makeInitCacheExpression(
                "constant",
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: metas.property,
                  },
                ),
                { path, meta: metas.property_cache },
                (property) =>
                  makeInitCacheExpression(
                    "constant",
                    makeGetExpression(
                      makeReadCacheExpression(object, path),
                      makeReadCacheExpression(property, path),
                      path,
                    ),
                    { path, meta: metas.result_cache },
                    (result) =>
                      makeSequenceExpression(
                        makeExpressionEffect(
                          makeSetExpression(
                            context.strict,
                            makeReadCacheExpression(object, path),
                            makeReadCacheExpression(property, path),
                            makeUpdateValueExpression(
                              operator,
                              makeReadCacheExpression(result, path),
                              update,
                              path,
                              metas.update,
                            ),
                            path,
                          ),
                          path,
                        ),
                        makeReadCacheExpression(result, path),
                        path,
                      ),
                  ),
              ),
          );
        }
      } else {
        if (prefix) {
          const metas = splitMeta(meta, [
            "property",
            "update",
            "super",
            "property_cache",
          ]);
          return makeInitCacheExpression(
            "constant",
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.property,
              computed: node.computed,
            }),
            { path, meta: metas.property_cache },
            (property) =>
              makeScopeSetSuperExpression(
                context,
                makeReadCacheExpression(property, path),
                makeUpdateValueExpression(
                  operator,
                  makeScopeGetSuperExpression(
                    context,
                    makeReadCacheExpression(property, path),
                    path,
                  ),
                  update,
                  path,
                  metas.update,
                ),
                path,
                metas.super,
              ),
          );
        } else {
          const metas = splitMeta(meta, [
            "property",
            "update",
            "super",
            "property_cache",
            "result_cache",
          ]);
          return makeInitCacheExpression(
            "constant",
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.property,
              computed: node.computed,
            }),
            { path, meta: metas.property_cache },
            (property) =>
              makeInitCacheExpression(
                "constant",
                makeScopeGetSuperExpression(
                  context,
                  makeReadCacheExpression(property, path),
                  path,
                ),
                { path, meta: metas.result_cache },
                (result) =>
                  makeLongSequenceExpression(
                    listScopeSetSuperEffect(
                      context,
                      makeReadCacheExpression(property, path),
                      makeUpdateValueExpression(
                        operator,
                        makeReadCacheExpression(result, path),
                        update,
                        path,
                        metas.update,
                      ),
                      path,
                    ),
                    makeReadCacheExpression(result, path),
                    path,
                  ),
              ),
          );
        }
      }
    }
    case "Identifier": {
      if (prefix) {
        const metas = splitMeta(meta, ["update", "write", "result_cache"]);
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
            path,
            metas.update,
          ),
          { path, meta: metas.result_cache },
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
        const metas = splitMeta(meta, ["update", "write", "result_cache"]);
        return makeInitCacheExpression(
          "constant",
          makeScopeReadExpression(
            context,
            /** @type {estree.Variable} */ (node.name),
            path,
          ),
          { path, meta: metas.result_cache },
          (result) =>
            makeLongSequenceExpression(
              listScopeWriteEffect(
                context,
                /** @type {estree.Variable} */ (node.name),
                makeUpdateValueExpression(
                  operator,
                  makeReadCacheExpression(result, path),
                  update,
                  path,
                  metas.update,
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
          "update",
          "object_cache",
          "property_cache",
        ]);
        return listInitCacheEffect(
          "constant",
          unbuildExpression(drill({ node, path }, "object"), context, {
            meta: metas.object,
            name: ANONYMOUS,
          }),
          { path, meta: metas.object_cache },
          (object) =>
            listInitCacheEffect(
              "constant",
              unbuildKeyExpression(drill({ node, path }, "property"), context, {
                computed: node.computed,
                meta: metas.property,
              }),
              { path, meta: metas.property_cache },
              (property) => [
                makeExpressionEffect(
                  makeSetExpression(
                    context.strict,
                    makeReadCacheExpression(object, path),
                    makeReadCacheExpression(property, path),
                    makeUpdateValueExpression(
                      operator,
                      makeGetExpression(
                        makeReadCacheExpression(object, path),
                        makeReadCacheExpression(property, path),
                        path,
                      ),
                      update,
                      path,
                      metas.update,
                    ),
                    path,
                  ),
                  path,
                ),
              ],
            ),
        );
      } else {
        const metas = splitMeta(meta, ["property", "update", "property_cache"]);
        return listInitCacheEffect(
          "constant",
          unbuildKeyExpression(drill({ node, path }, "property"), context, {
            meta: metas.property,
            computed: node.computed,
          }),
          { path, meta: metas.property_cache },
          (property) =>
            listScopeSetSuperEffect(
              context,
              makeReadCacheExpression(property, path),
              makeUpdateValueExpression(
                operator,
                makeScopeGetSuperExpression(
                  context,
                  makeReadCacheExpression(property, path),
                  path,
                ),
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
