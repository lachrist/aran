import { branch as conditional, guard } from "../../util/index.mjs";
import {
  initCache,
  makeInitCacheExpression,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { isNotSuperSite, isPrivateIdentifierSite } from "../predicate.mjs";
import { getPrivateKey } from "../query/index.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { drill } from "../site.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

/**
 * @type {<X>(
 *   site: import("../site.mjs").Site<estree.MemberExpression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     prepend: (
 *       head: aran.Effect<unbuild.Atom>,
 *       tail: X,
 *       path: unbuild.Path,
 *     ) => X,
 *     kontinue: (
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
  { prepend, kontinue },
) => {
  const { optional, computed } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    return initCache(
      "constant",
      unbuildExpression(sites.object, context, {}),
      { path, meta: metas.object },
      prepend,
      (object) => {
        if (isPrivateIdentifierSite(sites.property)) {
          return kontinue(
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
          return initCache(
            "constant",
            unbuildKeyExpression(sites.property, context, {
              convert: true,
              computed,
            }),
            { path, meta: metas.key },
            prepend,
            (key) =>
              kontinue(
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
      return initCache(
        "constant",
        unbuildKeyExpression(sites.property, context, {
          convert: true,
          computed,
        }),
        { path, meta: metas.key },
        prepend,
        (key) =>
          kontinue(
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
 * @type {<B extends boolean>(
 *   site: import("../site.mjs").Site<
 *     estree.MemberExpression & { optional: false},
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     object: B,
 *     kontinue: (
 *       object: B extends true
 *         ? (aran.Expression<unbuild.Atom> | "super")
 *         : null,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildMember = (
  { node, path, meta },
  context,
  { object: is_object_required, kontinue },
) => {
  const { computed } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    if (is_object_required) {
      return makeInitCacheExpression(
        "constant",
        unbuildExpression(sites.object, context, {}),
        { path, meta: metas.object },
        (object) =>
          kontinue(
            conditional(
              is_object_required,
              makeReadCacheExpression(object, path),
              null,
            ),
            makeGetMemberExpression(
              context,
              makeReadCacheExpression(object, path),
              isPrivateIdentifierSite(sites.property)
                ? getPrivateKey(sites.property.node)
                : unbuildKeyExpression(sites.property, context, {
                    convert: false,
                    computed,
                  }),
              { path, meta: metas.get },
            ),
          ),
      );
    } else {
      return kontinue(
        conditional(
          is_object_required,
          makePrimitiveExpression("dummy", path),
          null,
        ),
        makeGetMemberExpression(
          context,
          unbuildExpression(sites.object, context, {}),
          isPrivateIdentifierSite(sites.property)
            ? getPrivateKey(sites.property.node)
            : unbuildKeyExpression(sites.property, context, {
                convert: false,
                computed,
              }),
          { path, meta: metas.get },
        ),
      );
    }
  } else {
    return kontinue(
      conditional(is_object_required, "super", null),
      makeGetMemberExpression(
        context,
        "super",
        isPrivateIdentifierSite(sites.property)
          ? getPrivateKey(sites.property.node)
          : unbuildKeyExpression(sites.property, context, {
              convert: false,
              computed,
            }),
        { path, meta: metas.get },
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.MemberExpression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     exit: import("../cache.mjs").WritableCache,
 *     kontinue: (
 *       object: aran.Expression<unbuild.Atom>,
 *       value: aran.Expression<unbuild.Atom>,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainMember = (
  { node, path, meta },
  context,
  { exit, kontinue },
) => {
  const { computed, optional } = node;
  const metas = splitMeta(meta, ["drill", "object", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    return makeInitCacheExpression(
      "constant",
      unbuildExpression(sites.object, context, {}),
      { path, meta: metas.object },
      (object) =>
        makeConditionalExpression(
          makeReadCacheExpression(exit, path),
          makeReadCacheExpression(object, path),
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
                makeSequenceExpression(
                  makeWriteCacheEffect(
                    exit,
                    makePrimitiveExpression(true, path),
                    path,
                  ),
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                ),
                node,
                path,
              ),
            makeGetMemberExpression(
              context,
              makeReadCacheExpression(object, path),
              isPrivateIdentifierSite(sites.property)
                ? getPrivateKey(sites.property.node)
                : unbuildKeyExpression(sites.property, context, {
                    convert: false,
                    computed,
                  }),
              { path, meta: metas.get },
            ),
          ),
          path,
        ),
    );
  } else {
    return kontinue(
      makeSyntaxErrorExpression("Illegal 'super' in chain expression", path),
      makePrimitiveExpression("ARAN_DUMMY", path),
    );
  }
};
