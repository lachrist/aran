import { branch, guard } from "../../util/index.mjs";
import { makeInitCacheUnsafe, makeReadCacheExpression } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { isNotSuperSite, isPrivateIdentifierSite } from "../predicate.mjs";
import { getPrivateKey } from "../query/index.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { drill } from "../site.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

/**
 * @type {<X>(
 *   site: import("../site.mjs").Site<estree.MemberExpression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     kontinue: (
 *       setup: aran.Effect<unbuild.Atom>[],
 *       object: aran.Expression<unbuild.Atom> | "super",
 *       key: aran.Expression<unbuild.Atom> | estree.PrivateKey,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => X,
 *   },
 * ) => X}
 */
export const unbuildUpdateMember = (
  { node, path, meta },
  context,
  { kontinue },
) => {
  const { optional, computed } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    return makeInitCacheUnsafe(
      "constant",
      unbuildExpression(sites.object, context, {}),
      { path, meta: metas.object },
      (setup1, object) => {
        if (isPrivateIdentifierSite(sites.property)) {
          return kontinue(
            setup1,
            makeReadCacheExpression(object, path),
            getPrivateKey(sites.property.node),
            optional
              ? makeSyntaxErrorExpression(
                  "Illegal optional update member",
                  path,
                )
              : makeGetMemberExpression(
                  context,
                  makeReadCacheExpression(object, path),
                  getPrivateKey(sites.property.node),
                  { path, meta: metas.get },
                ),
          );
        } else {
          return makeInitCacheUnsafe(
            "constant",
            unbuildKeyExpression(sites.property, context, { computed }),
            { path, meta: metas.key },
            (setup2, key) =>
              kontinue(
                [...setup1, ...setup2],
                makeReadCacheExpression(object, path),
                makeReadCacheExpression(key, path),
                optional
                  ? makeSyntaxErrorExpression(
                      "Illegal optional update member",
                      path,
                    )
                  : makeGetMemberExpression(
                      context,
                      makeReadCacheExpression(object, path),
                      makeReadCacheExpression(key, path),
                      { path, meta: metas.get },
                    ),
              ),
          );
        }
      },
    );
  } else {
    if (isPrivateIdentifierSite(sites.property)) {
      return kontinue(
        [],
        "super",
        getPrivateKey(sites.property.node),
        optional
          ? makeSyntaxErrorExpression("Illegal optional update member", path)
          : makeGetMemberExpression(
              context,
              "super",
              getPrivateKey(sites.property.node),
              { path, meta: metas.get },
            ),
      );
    } else {
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(sites.property, context, { computed }),
        { path, meta: metas.key },
        (setup, key) =>
          kontinue(
            setup,
            "super",
            makeReadCacheExpression(key, path),
            optional
              ? makeSyntaxErrorExpression(
                  "Illegal optional update member",
                  path,
                )
              : makeGetMemberExpression(
                  context,
                  "super",
                  makeReadCacheExpression(key, path),
                  { path, meta: metas.get },
                ),
          ),
      );
    }
  }
};

/**
 * @type {<X, B extends boolean>(
 *   site: import("../site.mjs").Site<estree.MemberExpression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     object: B,
 *     kontinue: (
 *       setup: aran.Effect<unbuild.Atom>[],
 *       object: B extends true
 *         ? (aran.Expression<unbuild.Atom> | "super")
 *         : null,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => X,
 *   },
 * ) => X}
 */
export const unbuildMember = (
  { node, path, meta },
  context,
  { object: is_object_required, kontinue },
) => {
  const { computed, optional } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    if (optional || is_object_required) {
      return makeInitCacheUnsafe(
        "constant",
        unbuildExpression(sites.object, context, {}),
        { path, meta: metas.object },
        (setup, object) =>
          kontinue(
            setup,
            branch(
              is_object_required,
              makeReadCacheExpression(object, path),
              null,
            ),
            guard(
              optional,
              (node) =>
                makeConditionalExpression(
                  makeBinaryExpression(
                    "==",
                    makeReadCacheExpression(object, path),
                    makePrimitiveExpression(null, path),
                    path,
                  ),
                  makePrimitiveExpression({ undefined: null }, path),
                  node,
                  path,
                ),
              makeGetMemberExpression(
                context,
                makeReadCacheExpression(object, path),
                isPrivateIdentifierSite(sites.property)
                  ? getPrivateKey(sites.property.node)
                  : unbuildKeyExpression(sites.property, context, { computed }),
                { path, meta: metas.get },
              ),
            ),
          ),
      );
    } else {
      return kontinue(
        [],
        branch(
          is_object_required,
          makePrimitiveExpression("dummy", path),
          null,
        ),
        makeGetMemberExpression(
          context,
          unbuildExpression(sites.object, context, {}),
          isPrivateIdentifierSite(sites.property)
            ? getPrivateKey(sites.property.node)
            : unbuildKeyExpression(sites.property, context, { computed }),
          { path, meta: metas.get },
        ),
      );
    }
  } else {
    return kontinue(
      [],
      branch(is_object_required, "super", null),
      optional
        ? makeSyntaxErrorExpression("Illegal optional super member", path)
        : makeGetMemberExpression(
            context,
            "super",
            isPrivateIdentifierSite(sites.property)
              ? getPrivateKey(sites.property.node)
              : unbuildKeyExpression(sites.property, context, { computed }),
            { path, meta: metas.get },
          ),
    );
  }
};
