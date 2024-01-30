import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "./early-error.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { mapSequence, zeroSequence } from "./sequence.mjs";

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
 *   key: import("./sequence").ExpressionSequence,
 * ) => import("./sequence").ExpressionSequence}
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
 *   data: import("./sequence").ExpressionSequence,
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
 *   import("./prelude").NodePrelude,
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
 *   import("./prelude").NodePrelude,
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
 * ) => import("./sequence").ExpressionSequence}
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
 * ) => import("./sequence").ExpressionSequence}
 */
export const makePublicKeyExpression = ({ path }, key, { message }) => {
  switch (key.access) {
    case "public": {
      if (key.computed) {
        return key.data;
      } else {
        return makePrimitiveExpression(key.data, path);
      }
    }
    case "private": {
      return makeEarlyErrorExpression(message, path);
    }
    default: {
      return makeThrowErrorExpression(
        "TypeError",
        "Illegal access: 'protected'",
        path,
      );
    }
  }
};

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   key: import("./key").Key,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const listCheckStaticKeyEffect = ({ path }, key) => {
  if (key.computed) {
    return makeConditionalEffect(
      makeBinaryExpression(
        "===",
        key.data,
        makePrimitiveExpression("prototype", path),
        path,
      ),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          "Illegal computed static key: 'prototype'",
          path,
        ),
        path,
      ),
      EMPTY_EFFECT,
      path,
    );
  } else {
    if (key.access === "public" && key.data === "prototype") {
      return listEarlyErrorEffect(
        "Illegal non-computed static key: 'prototype'",
        path,
      );
    } else {
      return EMPTY_EFFECT;
    }
  }
};

// /**
//  * @type {(
//  *   site: import("./site").LeafSite,
//  *   key: import("./key").Key,
//  * ) => import("./sequence").Sequence<
//  *   import("./prelude").NodePrelude,
//  *   import("./cache").Cache,
//  * >}
//  */
// export const makeKeyCache = ({ path, meta }, key) => {
//   if (key.cooked) {
//     if (key.computed) {
//       return zeroSequence(key.data);
//     } else {
//       return zeroSequence(cachePrimitive(key.data));
//     }
//   } else {
//     if (key.computed) {
//       return cacheConstant(
//         meta,
//         makeApplyExpression(
//           makeIntrinsicExpression("aran.toPropertyKey", path),
//           makePrimitiveExpression({ undefined: null }, path),
//           [makeReadCacheExpression(key.data, path)],
//           path,
//         ),
//         path,
//       );
//     } else {
//       throw new AranTypeError(key);
//     }
//   }
// };
