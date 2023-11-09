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
} from "../scope/inner/index.mjs";
import {
  makeParamGetSuperExpression,
  makeParamSetSuperExpression,
  listParamSetSuperEffect,
} from "../param-index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";
import { drill } from "../site.mjs";
import { isNotSuperSite } from "../predicate.mjs";
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
      const { computed } = node;
      const metas = splitMeta(meta, [
        "drill",
        "object",
        "property",
        "update",
        "result",
        "super",
      ]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "object",
        "property",
      ]);
      if (node.optional) {
        return makeSyntaxErrorExpression("Invalid optional chaning", path);
      } else {
        if (isNotSuperSite(sites.object)) {
          if (prefix) {
            return makeInitCacheExpression(
              "constant",
              unbuildExpression(sites.object, context, {}),
              { path, meta: metas.object },
              (object) =>
                makeInitCacheExpression(
                  "constant",
                  unbuildKeyExpression(sites.property, context, { computed }),
                  { path, meta: metas.property },
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
                        { path, meta: metas.update },
                      ),
                      path,
                    ),
                ),
            );
          } else {
            return makeInitCacheExpression(
              "constant",
              unbuildExpression(sites.object, context, {}),
              { path, meta: metas.object },
              (object) =>
                makeInitCacheExpression(
                  "constant",
                  unbuildKeyExpression(sites.property, context, { computed }),
                  { path, meta: metas.property },
                  (property) =>
                    makeInitCacheExpression(
                      "constant",
                      makeGetExpression(
                        makeReadCacheExpression(object, path),
                        makeReadCacheExpression(property, path),
                        path,
                      ),
                      { path, meta: metas.result },
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
                                { path, meta: metas.update },
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
            return makeInitCacheExpression(
              "constant",
              unbuildKeyExpression(sites.property, context, { computed }),
              { path, meta: metas.property },
              (property) =>
                makeParamSetSuperExpression(
                  context,
                  makeReadCacheExpression(property, path),
                  makeUpdateValueExpression(
                    operator,
                    makeParamGetSuperExpression(
                      context,
                      makeReadCacheExpression(property, path),
                      path,
                    ),
                    update,
                    { path, meta: metas.update },
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
              unbuildKeyExpression(sites.property, context, { computed }),
              { path, meta: metas.property_cache },
              (property) =>
                makeInitCacheExpression(
                  "constant",
                  makeParamGetSuperExpression(
                    context,
                    makeReadCacheExpression(property, path),
                    path,
                  ),
                  { path, meta: metas.result_cache },
                  (result) =>
                    makeLongSequenceExpression(
                      listParamSetSuperEffect(
                        context,
                        makeReadCacheExpression(property, path),
                        makeUpdateValueExpression(
                          operator,
                          makeReadCacheExpression(result, path),
                          update,
                          { path, meta: metas.update },
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
      const { computed } = node;
      const metas = splitMeta(meta, [
        "drill",
        "object",
        "property",
        "update",
        "result",
      ]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "object",
        "property",
      ]);
      if (node.optional) {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression("Invalid optional chaning", path),
            path,
          ),
        ];
      } else {
        if (isNotSuperSite(sites.object)) {
          return listInitCacheEffect(
            "constant",
            unbuildExpression(sites.object, context, {}),
            { path, meta: metas.object },
            (object) =>
              listInitCacheEffect(
                "constant",
                unbuildKeyExpression(sites.property, context, { computed }),
                { path, meta: metas.property },
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
                        { path, meta: metas.update },
                      ),
                      path,
                    ),
                    path,
                  ),
                ],
              ),
          );
        } else {
          return listInitCacheEffect(
            "constant",
            unbuildKeyExpression(sites.property, context, { computed }),
            { path, meta: metas.property },
            (property) =>
              listParamSetSuperEffect(
                context,
                makeReadCacheExpression(property, path),
                makeUpdateValueExpression(
                  operator,
                  makeParamGetSuperExpression(
                    context,
                    makeReadCacheExpression(property, path),
                    path,
                  ),
                  update,
                  { path, meta: metas.update },
                ),
                path,
              ),
          );
        }
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
