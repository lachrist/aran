import { makeExpressionEffect, makePrimitiveExpression } from "../node.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildUpdateMember } from "./member.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { isNotOptionalMemberExpression } from "../predicate.mjs";
import { initSequence, mapSequence, zeroSequence } from "../sequence.mjs";
import { makeReadCacheExpression } from "../cache.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => import("../sequence.d.ts").EffectSequence<{
 *   name: estree.Variable | null,
 *   old_value: aran.Expression<unbuild.Atom>,
 *   update: (
 *     context: import("../context.js").Context,
 *     new_value: aran.Expression<unbuild.Atom>,
 *   ) => aran.Effect<unbuild.Atom>[],
 * }>}
 */
export const unbuildUpdateLeft = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return initSequence(
        [
          ...unbuildEffect({ node, path, meta }, context, {}),
          makeExpressionEffect(
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
          ),
        ],
        {
          name: null,
          old_value: makePrimitiveExpression({ undefined: null }, path),
          update: (_context, _new_value) => [],
        },
      );
    }
    case "MemberExpression": {
      if (isNotOptionalMemberExpression(node)) {
        const metas = splitMeta(meta, ["unbuild", "set"]);
        return mapSequence(
          unbuildUpdateMember({ node, path, meta: metas.unbuild }, context, {}),
          ({ object, key, member }) => ({
            name: null,
            old_value: member,
            update: (_context, new_value) =>
              listSetMemberEffect(
                context,
                typeof object === "string"
                  ? object
                  : makeReadCacheExpression(object, path),
                typeof key === "string"
                  ? key
                  : makeReadCacheExpression(key, path),
                new_value,
                {
                  path,
                  meta: metas.set,
                },
              ),
          }),
        );
      } else {
        return initSequence(
          [
            makeExpressionEffect(
              makeSyntaxErrorExpression(
                "Invalid optional member in left-hand side",
                path,
              ),
              path,
            ),
          ],
          {
            name: null,
            old_value: makePrimitiveExpression({ undefined: null }, path),
            update: (_context, _new_value) => [],
          },
        );
      }
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["read", "write"]);
      const variable = /** @type {estree.Variable} */ (node.name);
      return zeroSequence({
        name: variable,
        old_value: makeScopeReadExpression(
          { path, meta: metas.read },
          context,
          { variable },
        ),
        update: (context, new_value) =>
          listScopeWriteEffect({ path, meta: metas.write }, context, {
            variable,
            right: new_value,
          }),
      });
    }
    default: {
      return initSequence(
        [
          makeExpressionEffect(
            makeSyntaxErrorExpression(
              "Invalid optional member in left-hand side",
              path,
            ),
            path,
          ),
        ],
        {
          name: null,
          old_value: makePrimitiveExpression({ undefined: null }, path),
          update: (_context, _new_value) => [],
        },
      );
    }
  }
};
