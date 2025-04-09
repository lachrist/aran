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
 * @type {import("./object.d.ts").Object}
 */
export const SUPER_OBJECT = {
  type: "super",
};

/**
 * @type {(
 *   data: import("./atom.d.ts").Expression,
 * ) => import("./object.d.ts").Object}
 */
export const makeRegularObject = (data) => ({
  type: "regular",
  data,
});

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   object: import("./object.d.ts").Object,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *   ),
 *   [
 *     import("./object.d.ts").Object,
 *     import("./object.d.ts").Object,
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
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   object: import("./object.d.ts").Object,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").BodyPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *     | import("./prelude/index.d.ts").ConditionPrelude
 *   ),
 *   import("./object.d.ts").Object
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
