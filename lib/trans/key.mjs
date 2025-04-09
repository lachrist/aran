import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { initSyntaxErrorExpression } from "./prelude/index.mjs";
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
import { AranTypeError } from "../error.mjs";
import {
  EMPTY,
  liftSequenceX_,
  mapSequence,
  NULL_SEQUENCE,
  zeroSequence,
} from "../util/index.mjs";

/** @type {import("./key.d.ts").Key} */
export const ILLEGAL_NON_COMPUTED_KEY = {
  access: "public",
  computed: false,
  converted: true,
  data: /** @type {import("estree-sentry").PublicKeyName} */ (
    "_ARAN_ILLEGAL_NON_COMPUTED_KEY_"
  ),
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   key: import("./atom.d.ts").Expression,
 * ) => import("./atom.d.ts").Expression}
 */
export const makeConvertKeyExpression = (hash, key) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.toPropertyKey", hash),
    makeIntrinsicExpression("undefined", hash),
    [key],
    hash,
  );

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   key: import("./key.d.ts").Key,
 * ) => import("./key.d.ts").Key}
 */
export const convertKey = (hash, key) => {
  if (key.converted) {
    return key;
  } else {
    return {
      ...key,
      converted: true,
      data: makeConvertKeyExpression(hash, key.data),
    };
  }
};

/**
 * @type {(
 *   data: import("estree-sentry").PrivateKeyName,
 * ) => import("./key.d.ts").Key}
 */
export const makePrivateKey = (data) => ({
  access: "private",
  computed: false,
  converted: true,
  data,
});

/**
 * @type {(
 *   data: (
 *     | import("estree-sentry").PublicKeyName
 *     | import("estree-sentry").PublicKeyValue
 *   ),
 * ) => import("./key.d.ts").Key}
 */
export const makeStaticPublicKey = (data) => ({
  access: "public",
  computed: false,
  converted: true,
  data,
});

/**
 * @type {(
 *   data: import("./atom.d.ts").Expression,
 * ) => import("./key.d.ts").Key}
 */
export const makeDynamicPublicKey = (data) => ({
  access: "public",
  computed: true,
  converted: false,
  data,
});

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   key: import("./key.d.ts").Key,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").BodyPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./key.d.ts").Key,
 * >}
 */
export const cacheKey = (hash, meta, key) => {
  if (key.access === "public" && key.computed) {
    return mapSequence(cacheConstant(meta, key.data, hash), (data) => ({
      ...key,
      data: makeReadCacheExpression(data, hash),
    }));
  } else {
    return zeroSequence(key);
  }
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   key: import("./key.d.ts").Key,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").BodyPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *   ),
 *   [
 *     import("./key.d.ts").Key,
 *     import("./key.d.ts").Key,
 *   ],
 * >}
 */
export const duplicateKey = (hash, meta, key) => {
  if (key.access === "public" && key.computed) {
    return mapSequence(cacheConstant(meta, key.data, hash), (data) => [
      {
        ...key,
        data: makeReadCacheExpression(data, hash),
      },
      {
        ...key,
        data: makeReadCacheExpression(data, hash),
      },
    ]);
  } else {
    return zeroSequence([key, key]);
  }
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   key: import("./key.d.ts").Key,
 * ) => import("./atom.d.ts").Expression}
 */
export const makeKeyExpression = (hash, key) => {
  if (key.computed) {
    return key.data;
  } else {
    return makePrimitiveExpression(key.data, hash);
  }
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   key: import("./key.d.ts").Key,
 *   options: {
 *     message: string,
 *   },
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").SyntaxErrorPrelude,
 *   import("./atom.d.ts").Expression,
 * >}
 */
export const makePublicKeyExpression = (hash, key, { message }) => {
  switch (key.access) {
    case "public": {
      if (key.computed) {
        return zeroSequence(key.data);
      } else {
        return zeroSequence(makePrimitiveExpression(key.data, hash));
      }
    }
    case "private": {
      return initSyntaxErrorExpression(message, hash);
    }
    default: {
      throw new AranTypeError(key);
    }
  }
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   key: import("./key.d.ts").Key,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").SyntaxErrorPrelude,
 *   import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 * >}
 */
export const listCheckStaticKeyEffect = (hash, key) => {
  if (key.computed) {
    return zeroSequence(
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          key.data,
          makePrimitiveExpression("prototype", hash),
          hash,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Illegal computed static key: 'prototype'",
              hash,
            ),
            hash,
          ),
        ],
        EMPTY,
        hash,
      ),
    );
  } else {
    if (key.access === "public" && key.data === "prototype") {
      return liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression(
          "Illegal non-computed static key: 'prototype'",
          hash,
        ),
        hash,
      );
    } else {
      return NULL_SEQUENCE;
    }
  }
};
