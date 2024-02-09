import { AranTypeError } from "../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
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
import { makeKeyExpression } from "./key.mjs";
import { bindSequence, prefixExpression } from "./sequence.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     object: import("./object").Object,
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
      return makeScopeLoadExpression(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        {
          type: "get-super",
          mode,
          key: makeKeyExpression({ path }, key),
        },
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
        key: key.data,
      });
    } else if (key.access === "public") {
      return makeGetExpression(
        object.data,
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
 *     object: import("./object").Object,
 *     key: import("./key").Key,
 *     value: import("./sequence").ExpressionSequence,
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
      return listScopeSaveEffect(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        {
          type: "set-super",
          mode,
          key: makeKeyExpression({ path }, key),
          value,
        },
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
        key: key.data,
        value,
      });
    } else if (key.access === "public") {
      if (mode === "strict") {
        return makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [object.data, makeKeyExpression({ path }, key), value],
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
              prefixExpression(
                bindSequence(cacheConstant(meta, object.data, path), (object) =>
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "==",
                      makeReadCacheExpression(object, path),
                      makePrimitiveExpression(null, path),
                      path,
                    ),
                    makeReadCacheExpression(object, path),
                    makeApplyExpression(
                      makeIntrinsicExpression("Object", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [makeReadCacheExpression(object, path)],
                      path,
                    ),
                    path,
                  ),
                ),
              ),
              makeKeyExpression({ path }, key),
              value,
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
