import { AranTypeError } from "../error.mjs";
import { guard } from "../util/index.mjs";
import {
  cacheConstant,
  cachePrimitive,
  makeReadCacheExpression,
} from "./cache.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { zeroSequence } from "./sequence.mjs";

/**
 * @type {(
 *   key: estree.PrivateKey,
 * ) => import("./key").Key}
 */
export const makePrivateKey = (key) => ({
  access: "private",
  computed: false,
  cooked: true,
  value: key,
});

/**
 * @type {(
 *   key: estree.Key,
 * ) => import("./key").Key}
 */
export const makeStaticPublicKey = (key) => ({
  access: "public",
  computed: false,
  cooked: true,
  value: key,
});

/**
 * @type {(
 *   value: import("./cache").Cache,
 * ) =>import("./key").Key}
 */
export const makeEagerDynamicPublicKey = (value) => ({
  access: "public",
  computed: true,
  cooked: true,
  value,
});

/**
 * @type {(
 *   value: import("./cache").Cache,
 * ) =>import("./key").Key}
 */
export const makeLazyDynamicPublicKey = (value) => ({
  access: "public",
  computed: true,
  cooked: false,
  value,
});

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeKeyExpression = ({ path }, key) =>
  guard(
    !key.cooked,
    (node) =>
      makeApplyExpression(
        makeIntrinsicExpression("aran.toPropertyKey", path),
        makePrimitiveExpression({ undefined: null }, path),
        [node],
        path,
      ),
    key.computed
      ? makeReadCacheExpression(key.value, path)
      : makePrimitiveExpression(key.value, path),
  );

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   key: import("./key").Key,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").NodePrelude,
 *   import("./cache").Cache,
 * >}
 */
export const makeKeyCache = ({ path, meta }, key) => {
  if (key.cooked) {
    if (key.computed) {
      return zeroSequence(key.value);
    } else {
      return zeroSequence(cachePrimitive(key.value));
    }
  } else {
    if (key.computed) {
      return cacheConstant(
        meta,
        makeApplyExpression(
          makeIntrinsicExpression("aran.toPropertyKey", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadCacheExpression(key.value, path)],
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError(key);
    }
  }
};
