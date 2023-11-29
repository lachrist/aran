import {
  listInitCacheEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "./cache.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import { splitMeta } from "./mangle.mjs";
import { makeExpressionEffect, makeSequenceExpression } from "./node.mjs";
import {
  listSetPrivateEffect,
  listSetSuperEffect,
  makeGetPrivateExpression,
  makeGetSuperExpression,
  makeSetSuperExpression,
} from "./param/index.mjs";
import { makeSyntaxErrorExpression } from "./syntax-error.mjs";

/**
 * @type {(
 *   context: import("./context.js").Context,
 *   object: aran.Expression<unbuild.Atom> | "super",
 *   key: aran.Expression<unbuild.Atom> | estree.PrivateKey,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetMemberExpression = (
  context,
  object,
  key,
  { path, meta },
) => {
  if (object === "super") {
    if (typeof key === "string") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else {
      return makeGetSuperExpression({ path }, context, { key });
    }
  } else {
    if (typeof key === "string") {
      return makeInitCacheExpression(
        "constant",
        object,
        { path, meta },
        (target) =>
          makeGetPrivateExpression({ path }, context, { target, key }),
      );
    } else {
      return makeGetExpression(object, key, path);
    }
  }
};

/**
 * @type {(
 *   context: import("./context.js").Context,
 *   object: aran.Expression<unbuild.Atom> | "super",
 *   key: aran.Expression<unbuild.Atom> | estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetMemberEffect = (
  context,
  object,
  key,
  value,
  { path, meta },
) => {
  if (object === "super") {
    if (typeof key === "string") {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal private member of super", path),
          path,
        ),
      ];
    } else {
      return listSetSuperEffect({ path, meta }, context, { key, value });
    }
  } else {
    if (typeof key === "string") {
      const metas = splitMeta(meta, ["target", "value"]);
      return listInitCacheEffect(
        "constant",
        object,
        { path, meta: metas.target },
        (target) =>
          listInitCacheEffect(
            "constant",
            value,
            { path, meta: metas.value },
            (value) =>
              listSetPrivateEffect({ path }, context, {
                target,
                key,
                value,
              }),
          ),
      );
    } else {
      return [
        makeExpressionEffect(
          makeSetExpression(context.mode, object, key, value, path),
          path,
        ),
      ];
    }
  }
};

/**
 * @type {(
 *   context: import("./context.js").Context,
 *   object: aran.Expression<unbuild.Atom> | "super",
 *   key: aran.Expression<unbuild.Atom> | estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetMemberExpression = (
  context,
  object,
  key,
  value,
  { path, meta },
) => {
  if (object === "super") {
    if (typeof key === "string") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else {
      return makeSetSuperExpression({ path, meta }, context, { key, value });
    }
  } else {
    if (typeof key === "string") {
      const metas = splitMeta(meta, ["target", "value"]);
      return makeInitCacheExpression(
        "constant",
        object,
        { path, meta: metas.target },
        (target) =>
          makeInitCacheExpression(
            "constant",
            value,
            { path, meta: metas.value },
            (value) =>
              makeSequenceExpression(
                listSetPrivateEffect({ path }, context, {
                  target,
                  key,
                  value,
                }),
                makeReadCacheExpression(target, path),
                path,
              ),
          ),
      );
    } else {
      return makeSetExpression(context.mode, object, key, value, path);
    }
  }
};
