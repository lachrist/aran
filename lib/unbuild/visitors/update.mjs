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
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { forkMeta, mangleMetaVariable, splitMeta } from "../mangle.mjs";
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
import { makeCacheExpression } from "../cache.mjs";

/**
 * @type {(
 *   operator: estree.BinaryOperator | estree.LogicalOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeUpdateValueExpression = (operator, left, right, path, meta) => {
  switch (operator) {
    case "??": {
      return makeCacheExpression(left, path, mangleMetaVariable(meta), (left) =>
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
      return makeCacheExpression(left, path, mangleMetaVariable(meta), (left) =>
        makeConditionalExpression(
          left,
          left,
          right ?? makePrimitiveExpression(false, path),
          path,
        ),
      );
    }
    case "&&": {
      return makeCacheExpression(left, path, mangleMetaVariable(meta), (left) =>
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
        ? makeCacheExpression(left, path, mangleMetaVariable(meta), (left) =>
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
 *     meta: unbuild.RootMeta,
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
        // const object = {
        //   var: mangleMetaVariable(namespaces.object),
        //   val: unbuildExpression(drill({ node, path }, "object"), context, {
        //     name: ANONYMOUS,
        //   }),
        // };
        // const key = {
        //   var: mangleMetaVariable(namespaces.key),
        //   val: unbuildKeyExpression(
        //     drill({ node, path }, "property"),
        //     context,
        //     node,
        //   ),
        // };
        // const value = {
        //   var: mangleMetaVariable(namespaces.value),
        //   val: makeGetExpression(
        //     makeReadExpression(object.var, path),
        //     makeReadExpression(key.var, path),
        //     path,
        //   ),
        // };
        if (prefix) {
          const metas = splitMeta(meta, ["object", "key", "update"]);
          return makeLongSequenceExpression(
            [
              makeWriteEffect(
                mangleMetaVariable(metas.object),
                unbuildExpression(drill({ node, path }, "object"), context, {
                  meta: forkMeta(metas.object),
                  name: ANONYMOUS,
                }),
                true,
                path,
              ),
              makeWriteEffect(
                mangleMetaVariable(metas.key),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: forkMeta(metas.key),
                  },
                ),
                true,
                path,
              ),
            ],
            makeSetExpression(
              context.strict,
              makeReadExpression(mangleMetaVariable(metas.object), path),
              makeReadExpression(mangleMetaVariable(metas.key), path),
              makeUpdateValueExpression(
                operator,
                makeGetExpression(
                  makeReadExpression(mangleMetaVariable(metas.object), path),
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  path,
                ),
                update,
                path,
                forkMeta(metas.update),
              ),
              path,
            ),
            path,
          );
        } else {
          const metas = splitMeta(meta, ["object", "key", "old", "update"]);
          return makeLongSequenceExpression(
            [
              makeWriteEffect(
                mangleMetaVariable(metas.object),
                unbuildExpression(drill({ node, path }, "object"), context, {
                  meta: forkMeta(metas.object),
                  name: ANONYMOUS,
                }),
                true,
                path,
              ),
              makeWriteEffect(
                mangleMetaVariable(metas.key),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: forkMeta(metas.key),
                  },
                ),
                true,
                path,
              ),
              makeWriteEffect(
                mangleMetaVariable(metas.old),
                makeGetExpression(
                  makeReadExpression(mangleMetaVariable(metas.object), path),
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  path,
                ),
                true,
                path,
              ),
              makeExpressionEffect(
                makeSetExpression(
                  context.strict,
                  makeReadExpression(mangleMetaVariable(metas.object), path),
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  makeUpdateValueExpression(
                    operator,
                    makeReadExpression(mangleMetaVariable(metas.old), path),
                    update,
                    path,
                    forkMeta(metas.update),
                  ),
                  path,
                ),
                path,
              ),
            ],
            makeReadExpression(mangleMetaVariable(metas.old), path),
            path,
          );
        }
      } else {
        if (prefix) {
          const metas = splitMeta(meta, ["key", "update", "super"]);
          return makeSequenceExpression(
            makeWriteEffect(
              mangleMetaVariable(metas.key),
              unbuildKeyExpression(drill({ node, path }, "property"), context, {
                computed: node.computed,
                meta: forkMeta(metas.key),
              }),
              true,
              path,
            ),
            makeScopeSetSuperExpression(
              context,
              makeReadExpression(mangleMetaVariable(metas.key), path),
              makeUpdateValueExpression(
                operator,
                makeScopeGetSuperExpression(
                  context,
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  path,
                ),
                update,
                path,
                forkMeta(metas.update),
              ),
              path,
              forkMeta(metas.super),
            ),
            path,
          );
        } else {
          const metas = splitMeta(meta, ["key", "old", "update"]);
          return makeLongSequenceExpression(
            [
              makeWriteEffect(
                mangleMetaVariable(metas.key),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: forkMeta(metas.key),
                  },
                ),
                true,
                path,
              ),
              makeWriteEffect(
                mangleMetaVariable(metas.old),
                makeScopeGetSuperExpression(
                  context,
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  path,
                ),
                true,
                path,
              ),
              ...listScopeSetSuperEffect(
                context,
                makeReadExpression(mangleMetaVariable(metas.key), path),
                makeUpdateValueExpression(
                  operator,
                  makeReadExpression(mangleMetaVariable(metas.old), path),
                  update,
                  path,
                  forkMeta(metas.update),
                ),
                path,
              ),
            ],
            makeReadExpression(mangleMetaVariable(metas.old), path),
            path,
          );
        }
      }
    }
    case "Identifier": {
      if (prefix) {
        const metas = splitMeta(meta, ["new", "update", "write"]);
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              mangleMetaVariable(metas.new),
              makeUpdateValueExpression(
                operator,
                makeScopeReadExpression(
                  context,
                  /** @type {estree.Variable} */ (node.name),
                  path,
                ),
                update,
                path,
                forkMeta(metas.update),
              ),
              true,
              path,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              makeReadExpression(mangleMetaVariable(metas.new), path),
              path,
              forkMeta(metas.write),
            ),
          ],
          makeReadExpression(mangleMetaVariable(metas.new), path),
          path,
        );
      } else {
        const metas = splitMeta(meta, ["old", "update", "write"]);
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              mangleMetaVariable(metas.old),
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ (node.name),
                path,
              ),
              true,
              path,
            ),
            ...listScopeWriteEffect(
              context,
              /** @type {estree.Variable} */ (node.name),
              makeUpdateValueExpression(
                operator,
                makeReadExpression(mangleMetaVariable(metas.old), path),
                update,
                path,
                forkMeta(metas.update),
              ),
              path,
              forkMeta(metas.write),
            ),
          ],
          makeReadExpression(mangleMetaVariable(metas.old), path),
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
 *     update: aran.Expression<unbuild.Atom> | null,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     meta: unbuild.RootMeta,
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
        const metas = splitMeta(meta, ["object", "key", "update"]);
        return [
          makeWriteEffect(
            mangleMetaVariable(metas.object),
            unbuildExpression(drill({ node, path }, "object"), context, {
              meta: forkMeta(metas.object),
              name: ANONYMOUS,
            }),
            true,
            path,
          ),
          makeWriteEffect(
            mangleMetaVariable(metas.key),
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: forkMeta(metas.key),
              computed: node.computed,
            }),
            true,
            path,
          ),
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              makeReadExpression(mangleMetaVariable(metas.object), path),
              makeReadExpression(mangleMetaVariable(metas.key), path),
              makeUpdateValueExpression(
                operator,
                makeGetExpression(
                  makeReadExpression(mangleMetaVariable(metas.object), path),
                  makeReadExpression(mangleMetaVariable(metas.key), path),
                  path,
                ),
                update,
                path,
                forkMeta(metas.update),
              ),
              path,
            ),
            path,
          ),
        ];
      } else {
        const metas = splitMeta(meta, ["key", "update"]);
        return [
          makeWriteEffect(
            mangleMetaVariable(metas.key),
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              computed: node.computed,
              meta: forkMeta(metas.key),
            }),
            true,
            path,
          ),
          ...listScopeSetSuperEffect(
            context,
            makeReadExpression(mangleMetaVariable(metas.key), path),
            makeUpdateValueExpression(
              operator,
              makeScopeGetSuperExpression(
                context,
                makeReadExpression(mangleMetaVariable(metas.key), path),
                path,
              ),
              update,
              path,
              forkMeta(metas.update),
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
          makeUpdateValueExpression(
            operator,
            makeScopeReadExpression(
              context,
              /** @type {estree.Variable} */ (node.name),
              path,
            ),
            update,
            path,
            forkMeta(metas.update),
          ),
          path,
          forkMeta(metas.write),
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
