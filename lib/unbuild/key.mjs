import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "./early-error.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import {
  EMPTY_SEQUENCE,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "./sequence.mjs";
import { AranTypeError } from "../error.mjs";
import { EMPTY, concat_ } from "../util/index.mjs";

/** @type {import("./key").Key} */
export const ILLEGAL_NON_COMPUTED_KEY = {
  access: "public",
  computed: false,
  converted: true,
  data: /** @type {estree.Key} */ ("_ARAN_ILLEGAL_NON_COMPUTED_KEY_"),
};

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConvertKeyExpression = ({ path }, key) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.toPropertyKey", path),
    makePrimitiveExpression({ undefined: null }, path),
    [key],
    path,
  );

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 * ) => import("./key").Key}
 */
export const convertKey = ({ path }, key) => {
  if (key.converted) {
    return key;
  } else {
    return {
      ...key,
      converted: true,
      data: makeConvertKeyExpression({ path }, key.data),
    };
  }
};

/**
 * @type {(
 *   data: estree.PrivateKey,
 * ) => import("./key").Key}
 */
export const makePrivateKey = (data) => ({
  access: "private",
  computed: false,
  converted: true,
  data,
});

/**
 * @type {(
 *   data: estree.Key,
 * ) => import("./key").Key}
 */
export const makeStaticPublicKey = (data) => ({
  access: "public",
  computed: false,
  converted: true,
  data,
});

/**
 * @type {(
 *   data: aran.Expression<unbuild.Atom>,
 * ) => import("./key").Key}
 */
export const makeDynamicPublicKey = (data) => ({
  access: "public",
  computed: true,
  converted: false,
  data,
});

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   key: import("./key").Key,
 * ) => import("./sequence").Sequence<
 *   (
 *     | import("./prelude").BodyPrelude
 *     | import("./prelude").PrefixPrelude
 *   ),
 *   import("./key").Key,
 * >}
 */
export const cacheKey = ({ meta, path }, key) => {
  if (key.access === "public" && key.computed) {
    return mapSequence(cacheConstant(meta, key.data, path), (data) => ({
      ...key,
      data: makeReadCacheExpression(data, path),
    }));
  } else {
    return zeroSequence(key);
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   key: import("./key").Key,
 * ) => import("./sequence").Sequence<
 *   (
 *     | import("./prelude").BodyPrelude
 *     | import("./prelude").PrefixPrelude
 *   ),
 *   [
 *     import("./key").Key,
 *     import("./key").Key,
 *   ],
 * >}
 */
export const duplicateKey = ({ meta, path }, key) => {
  if (key.access === "public" && key.computed) {
    return mapSequence(cacheConstant(meta, key.data, path), (data) => [
      {
        ...key,
        data: makeReadCacheExpression(data, path),
      },
      {
        ...key,
        data: makeReadCacheExpression(data, path),
      },
    ]);
  } else {
    return zeroSequence([key, key]);
  }
};

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeKeyExpression = ({ path }, key) => {
  if (key.computed) {
    return key.data;
  } else {
    return makePrimitiveExpression(key.data, path);
  }
};

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 *   options: {
 *     message: string,
 *   },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makePublicKeyExpression = ({ path }, key, { message }) => {
  switch (key.access) {
    case "public": {
      if (key.computed) {
        return zeroSequence(key.data);
      } else {
        return zeroSequence(makePrimitiveExpression(key.data, path));
      }
    }
    case "private": {
      return makeEarlyErrorExpression(makeRegularEarlyError(message, path));
    }
    default: {
      throw new AranTypeError(key);
    }
  }
};

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listCheckStaticKeyEffect = ({ path }, key) => {
  if (key.computed) {
    return zeroSequence([
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          key.data,
          makePrimitiveExpression("prototype", path),
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Illegal computed static key: 'prototype'",
              path,
            ),
            path,
          ),
        ],
        EMPTY,
        path,
      ),
    ]);
  } else {
    if (key.access === "public" && key.data === "prototype") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError(
              "Illegal non-computed static key: 'prototype'",
              path,
            ),
          ),
          path,
        ),
      );
    } else {
      return EMPTY_SEQUENCE;
    }
  }
};
