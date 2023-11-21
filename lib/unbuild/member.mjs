import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import { makeExpressionEffect } from "./node.mjs";
import {
  listSetPrivateEffect,
  listSetSuperEffect,
  makeGetPrivateExpression,
  makeGetSuperExpression,
  makeSetPrivateExpression,
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
      return makeGetSuperExpression(context, key, { path });
    }
  } else {
    if (typeof key === "string") {
      return makeGetPrivateExpression({ path, meta }, context, { object, key });
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
      return listSetSuperEffect(context, key, value, { path, meta });
    }
  } else {
    if (typeof key === "string") {
      return listSetPrivateEffect({ path, meta }, context, {
        object,
        key,
        value,
      });
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
      return makeSetSuperExpression(context, key, value, { path, meta });
    }
  } else {
    if (typeof key === "string") {
      return makeSetPrivateExpression(
        {
          path,
          meta,
        },
        context,
        { object, key, value },
      );
    } else {
      return makeSetExpression(context.mode, object, key, value, path);
    }
  }
};
