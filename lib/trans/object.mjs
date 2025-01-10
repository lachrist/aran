import { AranTypeError } from "../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression } from "./intrinsic.mjs";
import { makeIntrinsicExpression, makePrimitiveExpression } from "./node.mjs";
import { makeConditionPrelude } from "./prelude/index.mjs";
import {
  zeroSequence,
  mapSequence,
  bindSequence,
  initSequence,
} from "../util/index.mjs";

/**
 * @type {import("./object").Object}
 */
export const SUPER_OBJECT = {
  type: "super",
};

/**
 * @type {(
 *   data: import("./atom").Expression,
 * ) => import("./object").Object}
 */
export const makeRegularObject = (data) => ({
  type: "regular",
  data,
});

/**
 * @type {(
 *   hash: import("./hash").Hash,
 *   meta: import("./meta").Meta,
 *   object: import("./object").Object,
 * ) => import("../util/sequence").Sequence<
 *   (
 *     | import("./prelude").MetaDeclarationPrelude
 *     | import("./prelude").PrefixPrelude
 *   ),
 *   [
 *     import("./object").Object,
 *     import("./object").Object,
 *   ],
 * >}
 */
export const duplicateObject = (hash, meta, object) => {
  switch (object.type) {
    case "super": {
      return zeroSequence([object, object]);
    }
    case "regular": {
      return mapSequence(cacheConstant(meta, object.data, hash), (data) => [
        {
          type: "regular",
          data: makeReadCacheExpression(data, hash),
        },
        {
          type: "regular",
          data: makeReadCacheExpression(data, hash),
        },
      ]);
    }
    default: {
      throw new AranTypeError(object);
    }
  }
};

/**
 * @type {(
 *   hash: import("./hash").Hash,
 *   meta: import("./meta").Meta,
 *   object: import("./object").Object,
 * ) => import("../util/sequence").Sequence<
 *   (
 *     | import("./prelude").BodyPrelude
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").ConditionPrelude
 *   ),
 *   import("./object").Object
 * >}
 */
export const optionalizeObject = (hash, meta, object) => {
  if (object.type === "super") {
    return initSequence(
      [
        {
          type: "syntax-error",
          data: {
            message: "Illegal optional member access to super",
            origin: hash,
          },
        },
      ],
      object,
    );
  } else if (object.type === "regular") {
    return bindSequence(cacheConstant(meta, object.data, hash), (object) =>
      initSequence(
        [
          makeConditionPrelude({
            test: makeBinaryExpression(
              "==",
              makeReadCacheExpression(object, hash),
              makePrimitiveExpression(null, hash),
              hash,
            ),
            exit: makeIntrinsicExpression("undefined", hash),
          }),
        ],
        {
          type: "regular",
          data: makeReadCacheExpression(object, hash),
        },
      ),
    );
  } else {
    throw new AranTypeError(object);
  }
};
