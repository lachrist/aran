import {
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeThrowErrorExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/inner/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { makeGetSuperExpression, makeSetSuperExpression } from "../record.mjs";
import { unbuildEffect } from "./effect.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill } from "../../drill.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

const BASENAME = /** @type {__basename} */ ("update");

/**
 * @type {(
 *   cache: {
 *     var: unbuild.Variable | aran.Parameter,
 *     val: aran.Expression<unbuild.Atom>,
 *   },
 *   path: unbuild.Path,
 *   kontinue: (
 *     variable: unbuild.Variable | aran.Parameter,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const cacheExpression = (cache, path, kontinue) =>
  cache.val.type === "ReadExpression"
    ? kontinue(cache.val.variable)
    : makeSequenceExpression(
        makeWriteEffect(cache.var, cache.val, true, path),
        kontinue(cache.var),
        path,
      );

/**
 * @type {(
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeUpdateValueExpression = (operator, left, right, path) => {
  const cache = {
    var: mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("update_logical_left"),
      path,
    ),
    val: left,
  };
  switch (operator) {
    case "??": {
      return cacheExpression(cache, path, (left) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadExpression(left, path),
            makePrimitiveExpression(null, path),
            path,
          ),
          right,
          makeReadExpression(left, path),
          path,
        ),
      );
    }
    case "||": {
      return cacheExpression(cache, path, (left) =>
        makeConditionalExpression(
          makeReadExpression(left, path),
          makeReadExpression(left, path),
          right,
          path,
        ),
      );
    }
    case "&&": {
      return cacheExpression(cache, path, (left) =>
        makeConditionalExpression(
          makeReadExpression(left, path),
          right,
          makeReadExpression(left, path),
          path,
        ),
      );
    }
    default: {
      return makeBinaryExpression(operator, left, right, path);
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
 *     update: aran.Expression<unbuild.Atom>,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateExpression = (
  { node, path },
  context,
  { update, prefix, operator },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return makeLongSequenceExpression(
        unbuildEffect({ node, path }, context, null),
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
      const record = {
        object: mangleMetaVariable(
          BASENAME,
          /** @type {__unique} */ ("object"),
          path,
        ),
        key: mangleMetaVariable(
          BASENAME,
          /** @type {__unique} */ ("key"),
          path,
        ),
        value: mangleMetaVariable(
          BASENAME,
          /** @type {__unique} */ ("value"),
          path,
        ),
      };
      if (isNotSuperMemberExpression(node)) {
        const object = {
          var: record.object,
          val: unbuildExpression(drill({ node, path }, "object"), context, {
            name: ANONYMOUS,
          }),
        };
        const key = {
          var: record.key,
          val: unbuildKeyExpression(
            drill({ node, path }, "property"),
            context,
            node,
          ),
        };
        const value = {
          var: record.value,
          val: makeGetExpression(
            makeReadExpression(object.var, path),
            makeReadExpression(key.var, path),
            path,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(object.var, object.val, true, path),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, true, path),
              makeSetExpression(
                context.strict,
                makeReadExpression(object.var, path),
                makeReadExpression(key.var, path),
                makeUpdateValueExpression(operator, value.val, update, path),
                path,
              ),
              path,
            ),
            path,
          );
        } else {
          return makeSequenceExpression(
            makeWriteEffect(object.var, object.val, true, path),
            makeSequenceExpression(
              makeWriteEffect(key.var, key.val, true, path),
              makeSequenceExpression(
                makeWriteEffect(value.var, value.val, true, path),
                makeSequenceExpression(
                  makeExpressionEffect(
                    makeSetExpression(
                      context.strict,
                      makeReadExpression(object.var, path),
                      makeReadExpression(key.var, path),
                      makeUpdateValueExpression(
                        operator,
                        makeReadExpression(value.var, path),
                        update,
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                  makeReadExpression(value.var, path),
                  path,
                ),
                path,
              ),
              path,
            ),
            path,
          );
        }
      } else {
        const key = {
          var: record.key,
          val: unbuildKeyExpression(
            drill({ node, path }, "property"),
            context,
            node,
          ),
        };
        const value = {
          var: record.value,
          val: makeGetSuperExpression(
            context,
            makeReadExpression(key.var, path),
            path,
          ),
        };
        if (prefix) {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, true, path),
            makeSetSuperExpression(
              context,
              makeReadExpression(key.var, path),
              makeUpdateValueExpression(operator, value.val, update, path),
              path,
            ),
            path,
          );
        } else {
          return makeSequenceExpression(
            makeWriteEffect(key.var, key.val, true, path),
            makeSequenceExpression(
              makeWriteEffect(value.var, value.val, true, path),
              makeSequenceExpression(
                makeExpressionEffect(
                  makeSetSuperExpression(
                    context,
                    makeReadExpression(key.var, path),
                    makeUpdateValueExpression(
                      operator,
                      makeReadExpression(value.var, path),
                      update,
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
                makeReadExpression(value.var, path),
                path,
              ),
              path,
            ),
            path,
          );
        }
      }
    }
    case "Identifier": {
      const old_value = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("old_value"),
        path,
      );
      const new_value = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("new_value"),
        path,
      );
      if (prefix) {
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              new_value,
              makeUpdateValueExpression(
                operator,
                makeScopeReadExpression(
                  context,
                  /** @type {estree.Variable} */ (node.name),
                  path,
                ),
                update,
                path,
              ),
              true,
              path,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              new_value,
              path,
            ),
          ],
          makeReadExpression(new_value, path),
          path,
        );
      } else {
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              old_value,
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ (node.name),
                path,
              ),
              true,
              path,
            ),
            makeWriteEffect(
              new_value,
              makeUpdateValueExpression(
                operator,
                makeReadExpression(old_value, path),
                update,
                path,
              ),
              true,
              path,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              new_value,
              path,
            ),
          ],
          makeReadExpression(old_value, path),
          path,
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
 *     update: aran.Expression<unbuild.Atom>,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *   }
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateEffect = (
  { node, path },
  context,
  { update, operator },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return [
        ...unbuildEffect({ node, path }, context, null),
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
      const object = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("effect_object"),
        path,
      );
      const key = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("effect_key"),
        path,
      );
      if (isNotSuperMemberExpression(node)) {
        return [
          makeWriteEffect(
            object,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            true,
            path,
          ),
          makeWriteEffect(
            key,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            true,
            path,
          ),
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              makeReadExpression(object, path),
              makeReadExpression(key, path),
              makeUpdateValueExpression(
                operator,
                makeGetExpression(
                  makeReadExpression(object, path),
                  makeReadExpression(key, path),
                  path,
                ),
                update,
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      } else {
        return [
          makeWriteEffect(
            key,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            true,
            path,
          ),
          makeExpressionEffect(
            makeSetSuperExpression(
              context,
              makeReadExpression(key, path),
              makeUpdateValueExpression(
                operator,
                makeGetSuperExpression(
                  context,
                  makeReadExpression(key, path),
                  path,
                ),
                update,
                path,
              ),
              path,
            ),
            path,
          ),
        ];
      }
    }
    case "Identifier": {
      const right = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("right"),
        path,
      );
      return [
        makeWriteEffect(
          right,
          makeUpdateValueExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
            update,
            path,
          ),
          true,
          path,
        ),
        ...listScopeWriteEffect(
          context,
          /** @type {estree.Variable} */ (node.name),
          right,
          path,
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
