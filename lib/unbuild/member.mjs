import { AranTypeError } from "../error.mjs";
import { makeReadCacheExpression } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  EMPTY_EFFECT,
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
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "./early-error.mjs";
import { makeKeyCache, makeKeyExpression } from "./key.mjs";
import { bindSequence } from "./sequence.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./visitors/object").Object,
 *     key: import("./key").Key,
 *   },
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeGetMemberExpression = (
  { path, meta },
  scope,
  { object, key },
) => {
  const mode = getMode(scope);
  if (object.type === "super") {
    if (key.access === "private") {
      return makeEarlyErrorExpression("Illegal private member of super", path);
    } else if (key.access === "public") {
      return bindSequence(
        makeKeyCache({ path, meta: forkMeta((meta = nextMeta(meta))) }, key),
        (key) =>
          makeScopeLoadExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "get-super",
              mode,
              key,
            },
          ),
      );
    } else {
      throw new AranTypeError(key);
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
      throw new AranTypeError(key);
    }
  } else {
    throw new AranTypeError(object);
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./visitors/object").Object,
 *     key: import("./key").Key,
 *     value: import("./cache").Cache,
 *   },
 * ) => import("./sequence").EffectSequence}
 */
export const listSetMemberEffect = (
  { path, meta },
  scope,
  { object, key, value },
) => {
  const mode = getMode(scope);
  if (object.type === "super") {
    if (key.access === "private") {
      return listEarlyErrorEffect("Illegal private member of super", path);
    } else if (key.access === "public") {
      return bindSequence(
        makeKeyCache({ path, meta: forkMeta((meta = nextMeta(meta))) }, key),
        (key) =>
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "set-super",
              mode,
              key,
              value,
            },
          ),
      );
    } else {
      throw new AranTypeError(key);
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
        return makeConditionalEffect(
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
          EMPTY_EFFECT,
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Cannot assign to read only property",
              path,
            ),
            path,
          ),
          path,
        );
      } else if (mode === "sloppy") {
        return makeExpressionEffect(
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
                makeReadCacheExpression(object.data, path),
                makeApplyExpression(
                  makeIntrinsicExpression("Object", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [makeReadCacheExpression(object.data, path)],
                  path,
                ),
                path,
              ),
              makeKeyExpression({ path }, key),
              makeReadCacheExpression(value, path),
            ],
            path,
          ),
          path,
        );
      } else {
        throw new AranTypeError(mode);
      }
    } else {
      throw new AranTypeError(key);
    }
  } else {
    throw new AranTypeError(object);
  }
};
