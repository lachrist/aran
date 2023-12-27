import { AranTypeError } from "../error.mjs";
import { cachePrimitive, makeReadCacheExpression } from "./cache.mjs";
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   key: import("./visitors/key").Key,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeKeyExpression = ({ path }, key) => {
  if (key.computed) {
    return makeReadCacheExpression(key.value, path);
  } else {
    return makePrimitiveExpression(key.value, path);
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./visitors/object").Object,
 *     key: import("./visitors/key").Key,
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
    if (key.access === "private") {
      return makeSyntaxErrorExpression("Illegal private member of super", path);
    } else if (key.access === "public") {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "get-super",
        mode,
        key: key.computed ? key.value : cachePrimitive(key.value),
      });
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else if (object.type === "regular") {
    if (key.access === "private") {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "get-private",
        mode,
        target: object.data,
        key: key.value,
      });
    } else if (key.access === "public") {
      return makeGetExpression(
        makeReadCacheExpression(object.data, path),
        makeKeyExpression({ path }, key),
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
 *     object: import("./visitors/object").Object,
 *     key: import("./visitors/key").Key,
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
    if (key.access === "private") {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal private member of super", path),
          path,
        ),
      ];
    } else if (key.access === "public") {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "set-super",
        mode,
        key: key.computed ? key.value : cachePrimitive(key.value),
        value,
      });
    } else {
      throw new AranTypeError("invalid key", key);
    }
  } else if (object.type === "regular") {
    if (key.access === "private") {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "set-private",
        mode,
        target: object.data,
        key: key.value,
        value,
      });
    } else if (key.access === "public") {
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
                  makeKeyExpression({ path }, key),
                  makeApplyExpression(
                    makeIntrinsicExpression("Object", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [makeReadCacheExpression(object.data, path)],
                    path,
                  ),
                  path,
                ),
                makeReadCacheExpression(object.data, path),
                makeKeyExpression({ path }, key),
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
                makeKeyExpression({ path }, key),
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
