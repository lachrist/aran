import { makeExpressionEffect, makeSequenceExpression } from "../node.mjs";
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

/**
 * @type {<X>(
 *   site: import("../site.mjs").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     wrap: (
 *       head: aran.Expression<unbuild.Atom>,
 *       path: unbuild.Path,
 *     ) => X,
 *     prepend: (
 *       head: aran.Effect<unbuild.Atom>[],
 *       tail: X,
 *       path: unbuild.Path,
 *     ) => X,
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         name: estree.Variable | null,
 *         old_value: aran.Expression<unbuild.Atom>,
 *         kontinue: (
 *           context: import("../context.d.ts").Context,
 *           options: {
 *             new_value: aran.Expression<unbuild.Atom>,
 *           },
 *         ) => aran.Effect<unbuild.Atom>[],
 *       },
 *     ) => X,
 *   },
 * ) => X}
 */
const unbuildUpdateLeft = (
  { node, path, meta },
  context,
  { wrap, prepend, kontinue },
) => {
  switch (node.type) {
    // > console.log("foo") += console.log("bar");
    // foo
    // Uncaught ReferenceError: Invalid left-hand side in assignment
    case "CallExpression": {
      return prepend(
        unbuildEffect({ node, path, meta }, context, {}),
        wrap(
          makeThrowErrorExpression(
            "ReferenceError",
            "Invalid left-hand side in assignment",
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "MemberExpression": {
      if (isNotOptionalMemberExpression(node)) {
        const metas = splitMeta(meta, ["unbuild", "set"]);
        return unbuildUpdateMember(
          { node, path, meta: metas.unbuild },
          context,
          {
            prepend,
            kontinue: (context, { object, key, member: old_value }) =>
              kontinue(context, {
                old_value,
                name: null,
                kontinue: (context, { new_value }) =>
                  listSetMemberEffect(context, object, key, new_value, {
                    path,
                    meta: metas.set,
                  }),
              }),
          },
        );
      } else {
        return wrap(
          makeSyntaxErrorExpression(
            "Invalid optional member in left-hand side",
            path,
          ),
          path,
        );
      }
    }
    case "Identifier": {
      const metas = splitMeta(meta, ["read", "write"]);
      const variable = /** @type {estree.Variable} */ (node.name);
      return kontinue(context, {
        name: variable,
        old_value: makeScopeReadExpression(context, variable, {
          path,
          meta: metas.read,
        }),
        kontinue: (context, { new_value }) =>
          listScopeWriteEffect(context, variable, new_value, {
            path,
            meta: metas.write,
          }),
      });
    }
    default: {
      return wrap(
        makeSyntaxErrorExpression("Invalid left-hand side in assignment", path),
        path,
      );
    }
  }
};

////////////////
// expression //
////////////////

/**
 * @type {(
 *   head: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const wrapExpression = (head, _path) => head;

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         name: estree.Variable | null,
 *         old_value: aran.Expression<unbuild.Atom>,
 *         kontinue: (
 *           context: import("../context.d.ts").Context,
 *           options: {
 *             new_value: aran.Expression<unbuild.Atom>,
 *           },
 *         ) => aran.Effect<unbuild.Atom>[],
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildUpdateLeftExpression = (site, context, { kontinue }) =>
  unbuildUpdateLeft(site, context, {
    kontinue,
    prepend: makeSequenceExpression,
    wrap: wrapExpression,
  });

////////////
// effect //
////////////

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>[],
 *   tail: aran.Effect<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const prependEffect = (head, tail, _path) => [...head, ...tail];

/**
 * @type {(
 *   head: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const wrapEffect = (head, path) => [makeExpressionEffect(head, path)];

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Pattern | estree.Expression
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         name: estree.Variable | null,
 *         old_value: aran.Expression<unbuild.Atom>,
 *         kontinue: (
 *           context: import("../context.d.ts").Context,
 *           options: {
 *             new_value: aran.Expression<unbuild.Atom>,
 *           },
 *         ) => aran.Effect<unbuild.Atom>[],
 *       },
 *     ) => aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildUpdateLeftEffect = (site, context, { kontinue }) =>
  unbuildUpdateLeft(site, context, {
    kontinue,
    prepend: prependEffect,
    wrap: wrapEffect,
  });
