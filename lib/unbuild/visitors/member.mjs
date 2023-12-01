import { conditional, guard } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { isNotSuperSite, isPrivateIdentifierSite } from "../predicate.mjs";
import { getPrivateKey } from "../query/index.mjs";
import { drill } from "../site.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  mapSequence,
  sequenceExpression,
  zeroSequence,
} from "../sequence.mjs";

/**
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
 */

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("../context.js").Context} Context
 */

/**
 * @typedef {Cache | "super"} Object
 */

/**
 * @typedef {Cache | estree.PrivateKey} Key
 */

/**
 * @template X
 * @typedef {import("../sequence.js").EffectSequence<X>} EffectSequence
 */

/**
 * @type {(
 *   site: Site<
 *     estree.MemberExpression & { optional: false }
 *   >,
 *   context: Context,
 *   options: {},
 * ) => EffectSequence<{
 *   object: Object,
 *   key: Key,
 *   member: aran.Expression<unbuild.Atom>,
 * }>}
 */
export const unbuildUpdateMember = ({ node, path, meta }, context, {}) => {
  const { computed } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    return bindSequence(
      cacheConstant(
        metas.object,
        unbuildExpression(sites.object, context, {}),
        path,
      ),
      (object) => {
        if (isPrivateIdentifierSite(sites.property)) {
          return zeroSequence({
            object,
            key: /** @type {Key} */ (getPrivateKey(sites.property.node)),
            member: makeGetMemberExpression(
              context,
              makeReadCacheExpression(object, path),
              getPrivateKey(sites.property.node),
              { path, meta: metas.get },
            ),
          });
        } else {
          return mapSequence(
            cacheConstant(
              metas.key,
              unbuildKeyExpression(sites.property, context, {
                convert: false,
                computed,
              }),
              path,
            ),
            (key) => ({
              object,
              key,
              member: makeGetMemberExpression(
                context,
                makeReadCacheExpression(object, path),
                makeReadCacheExpression(key, path),
                { path, meta: metas.get },
              ),
            }),
          );
        }
      },
    );
  } else {
    if (isPrivateIdentifierSite(sites.property)) {
      return zeroSequence({
        object: "super",
        key: getPrivateKey(sites.property.node),
        member: makeGetMemberExpression(
          context,
          "super",
          getPrivateKey(sites.property.node),
          { path, meta: metas.get },
        ),
      });
    } else {
      return mapSequence(
        cacheConstant(
          metas.key,
          unbuildKeyExpression(sites.property, context, {
            convert: false,
            computed,
          }),
          path,
        ),
        (key) => ({
          object: "super",
          key,
          member: makeGetMemberExpression(
            context,
            "super",
            makeReadCacheExpression(key, path),
            { path, meta: metas.get },
          ),
        }),
      );
    }
  }
};

/**
 * @type {<B extends boolean>(
 *   site: Site<
 *     estree.MemberExpression & { optional: false }
 *   >,
 *   context: Context,
 *   options: {
 *     object: B,
 *   },
 * ) => EffectSequence<{
 *   object: B extends true ? Object : null,
 *   member: aran.Expression<unbuild.Atom>,
 * }>}
 */
export const unbuildMember = (
  { node, path, meta },
  context,
  { object: is_object_required },
) => {
  const { computed } = node;
  const metas = splitMeta(meta, ["drill", "object", "key", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    if (is_object_required) {
      return mapSequence(
        cacheConstant(
          metas.object,
          unbuildExpression(sites.object, context, {}),
          path,
        ),
        (object) => ({
          object: conditional(is_object_required, object, null),
          member: makeGetMemberExpression(
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
        }),
      );
    } else {
      return zeroSequence({
        object: conditional(is_object_required, /* dummy */ "super", null),
        member: makeGetMemberExpression(
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
      });
    }
  } else {
    return zeroSequence({
      object: conditional(is_object_required, "super", null),
      member: makeGetMemberExpression(
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
    });
  }
};

/**
 * @type {<B extends boolean>(
 *   site: import("../site.mjs").Site<estree.MemberExpression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     object: B,
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         object: B extends true
 *           ? (aran.Expression<unbuild.Atom> | "super")
 *           : null,
 *         member: aran.Expression<unbuild.Atom>,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainMember = (
  { node, path, meta },
  context,
  { object: is_object_required, kontinue },
) => {
  const { computed, optional } = node;
  const metas = splitMeta(meta, ["drill", "object", "get"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "object",
    "property",
  ]);
  if (isNotSuperSite(sites.object)) {
    return unbuildChainElement(sites.object, context, {
      kontinue: (context, { result: object }) =>
        optional || is_object_required
          ? sequenceExpression(
              mapSequence(cacheConstant(metas.object, object, path), (object) =>
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
                  kontinue(context, {
                    object: conditional(
                      is_object_required,
                      makeReadCacheExpression(object, path),
                      null,
                    ),
                    member: makeGetMemberExpression(
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
                  }),
                ),
              ),
              path,
            )
          : kontinue(context, {
              object: /** @type {any} */ (null),
              member: makeGetMemberExpression(
                context,
                object,
                isPrivateIdentifierSite(sites.property)
                  ? getPrivateKey(sites.property.node)
                  : unbuildKeyExpression(sites.property, context, {
                      convert: false,
                      computed,
                    }),
                { path, meta: metas.get },
              ),
            }),
    });
  } else {
    return kontinue(context, {
      object: conditional(is_object_required, "super", null),
      member: makeGetMemberExpression(
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
    });
  }
};
