import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import { splitMeta } from "./mangle.mjs";
import { makeExpressionEffect, makeSequenceExpression } from "./node.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "./scope/index.mjs";
import {
  mapSequence,
  mapTwoSequence,
  sequenceEffect,
  sequenceExpression,
} from "./sequence.mjs";
import { makeSyntaxErrorExpression } from "./syntax-error.mjs";

/**
 * @type {(
 *   scope: import("./scope").Scope,
 *   object: aran.Expression<unbuild.Atom> | "super",
 *   key: aran.Expression<unbuild.Atom> | estree.PrivateKey,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetMemberExpression = (scope, object, key, { path, meta }) => {
  if (object === "super") {
    if (typeof key === "string") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else {
      const metas = splitMeta(meta, ["key", "load"]);
      return sequenceExpression(
        mapSequence(cacheConstant(metas.key, key, path), (key) =>
          makeScopeLoadExpression({ path, meta: metas.load }, scope, {
            type: "get-super",
            mode: getMode(scope),
            key,
          }),
        ),
        path,
      );
    }
  } else {
    if (typeof key === "string") {
      const metas = splitMeta(meta, ["target", "load"]);
      return sequenceExpression(
        mapSequence(cacheConstant(metas.target, object, path), (target) =>
          makeScopeLoadExpression({ path, meta }, scope, {
            type: "get-private",
            mode: getMode(scope),
            target,
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
 *   scope: import("./scope").Scope,
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
  scope,
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
      const metas = splitMeta(meta, ["key", "value", "save"]);
      return sequenceEffect(
        mapTwoSequence(
          cacheConstant(metas.key, key, path),
          cacheConstant(metas.value, value, path),
          (key, value) =>
            listScopeSaveEffect({ path, meta: metas.save }, scope, {
              type: "set-super",
              mode: getMode(scope),
              key,
              value,
            }),
        ),
        path,
      );
    }
  } else {
    if (typeof key === "string") {
      const metas = splitMeta(meta, ["target", "value", "save"]);
      return sequenceEffect(
        mapTwoSequence(
          cacheConstant(metas.target, object, path),
          cacheConstant(metas.value, value, path),
          (target, value) =>
            listScopeSaveEffect({ path, meta: metas.save }, scope, {
              type: "set-private",
              mode: getMode(scope),
              target,
              key,
              value,
            }),
        ),
        path,
      );
    } else {
      return [
        makeExpressionEffect(
          makeSetExpression(getMode(scope), object, key, value, path),
          path,
        ),
      ];
    }
  }
};

/**
 * @type {(
 *   scope: import("./scope").Scope,
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
  scope,
  object,
  key,
  value,
  { path, meta },
) => {
  if (object === "super") {
    if (typeof key === "string") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else {
      const metas = splitMeta(meta, ["key", "value", "save"]);
      return sequenceExpression(
        mapTwoSequence(
          cacheConstant(metas.key, key, path),
          cacheConstant(metas.value, value, path),
          (key, value) =>
            makeSequenceExpression(
              listScopeSaveEffect({ path, meta: metas.save }, scope, {
                type: "set-super",
                mode: getMode(scope),
                key,
                value,
              }),
              makeReadCacheExpression(value, path),
              path,
            ),
        ),
        path,
      );
    }
  } else {
    if (typeof key === "string") {
      const metas = splitMeta(meta, ["target", "value", "save"]);
      return sequenceExpression(
        mapTwoSequence(
          cacheConstant(metas.target, object, path),
          cacheConstant(metas.value, value, path),
          (target, value) =>
            makeSequenceExpression(
              listScopeSaveEffect({ path, meta: metas.save }, scope, {
                type: "set-private",
                mode: getMode(scope),
                target,
                key,
                value,
              }),
              makeReadCacheExpression(value, path),
              path,
            ),
        ),
        path,
      );
    } else {
      return makeSetExpression(getMode(scope), object, key, value, path);
    }
  }
};
