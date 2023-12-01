import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import { splitMeta } from "./mangle.mjs";
import { makeExpressionEffect } from "./node.mjs";
import {
  listSetPrivateEffect,
  listSetSuperEffect,
  makeGetPrivateExpression,
  makeGetSuperExpression,
  makeSetSuperExpression,
} from "./param/index.mjs";
import {
  bindSequence,
  initSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
} from "./sequence.mjs";
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
      return sequenceExpression(
        mapSequence(cacheConstant(meta, object, path), (object) =>
          makeGetPrivateExpression({ path }, context, {
            target: object,
            key,
          }),
        ),
        path,
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
      return listenSequence(
        bindSequence(cacheConstant(metas.target, object, path), (object) =>
          bindSequence(cacheConstant(metas.value, value, path), (value) =>
            tellSequence(
              listSetPrivateEffect({ path }, context, {
                target: object,
                key,
                value,
              }),
            ),
          ),
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
      return sequenceExpression(
        bindSequence(cacheConstant(metas.target, object, path), (object) =>
          bindSequence(cacheConstant(metas.value, value, path), (value) =>
            initSequence(
              listSetPrivateEffect({ path }, context, {
                target: object,
                key,
                value,
              }),
              makeReadCacheExpression(object, path),
            ),
          ),
        ),
        path,
      );
    } else {
      return makeSetExpression(context.mode, object, key, value, path);
    }
  }
};
