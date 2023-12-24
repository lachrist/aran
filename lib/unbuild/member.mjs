import { AranTypeError } from "../error.mjs";
import { makeReadCacheExpression } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "./scope/index.mjs";
import { makeSyntaxErrorExpression } from "./syntax-error.mjs";

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./member").MemberObject,
 *     key: import("./member").MemberKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetMemberExpression = (
  { path, meta },
  scope,
  { object, key },
) => {
  const mode = getMode(scope);
  if (object.type === "super") {
    if (key.type === "private") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else if (key.type === "public") {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "get-super",
        mode,
        key: key.data,
      });
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else if (object.type === "regular") {
    if (key.type === "private") {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "get-private",
        mode,
        target: object.data,
        key: key.data,
      });
    } else if (key.type === "public") {
      return makeGetExpression(
        makeReadCacheExpression(object.data, path),
        makeReadCacheExpression(key.data, path),
        path,
      );
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else {
    throw new AranTypeError("invalid object", object);
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./member").MemberObject,
 *     key: import("./member").MemberKey,
 *     value: import("./cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetMemberEffect = (
  { path, meta },
  scope,
  { object, key, value },
) => {
  const mode = getMode(scope);
  if (object.type === "super") {
    if (key.type === "private") {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal private member of super", path),
          path,
        ),
      ];
    } else if (key.type === "public") {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "set-super",
        mode,
        key: key.data,
        value,
      });
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else if (object.type === "regular") {
    if (key.type === "private") {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "set-private",
        mode,
        target: object.data,
        key: key.data,
        value,
      });
    } else if (key.type === "public") {
      if (mode === "strict") {
        return [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeConditionalExpression(
                  makeBinaryExpression(
                    "==",
                    makeReadCacheExpression(object.data, path),
                    makePrimitiveExpression({ undefined: null }, path),
                    path,
                  ),
                  makeReadCacheExpression(key.data, path),
                  makeApplyExpression(
                    makeIntrinsicExpression("Object", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [makeReadCacheExpression(object.data, path)],
                    path,
                  ),
                  path,
                ),
                makeReadCacheExpression(object.data, path),
                makeReadCacheExpression(key.data, path),
                makeReadCacheExpression(value, path),
              ],
              path,
            ),
            [],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "Cannot assign to read only property",
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ];
      } else if (mode === "sloppy") {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(object.data, path),
                makeReadCacheExpression(key.data, path),
                makeReadCacheExpression(value, path),
              ],
              path,
            ),
            path,
          ),
        ];
      } else {
        throw new AranTypeError("invalid mode", mode);
      }
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else {
    throw new AranTypeError("invalid object", object);
  }
};
