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
} from "../sequence.mjs";

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
 *   site: import("./site").LeafSite,
 *   object: import("./object").Object,
 * ) => import("../sequence").Sequence<
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
export const duplicateObject = ({ path, meta }, object) => {
  switch (object.type) {
    case "super": {
      return zeroSequence([object, object]);
    }
    case "regular": {
      return mapSequence(cacheConstant(meta, object.data, path), (data) => [
        {
          type: "regular",
          data: makeReadCacheExpression(data, path),
        },
        {
          type: "regular",
          data: makeReadCacheExpression(data, path),
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
 *   site: import("./site").LeafSite,
 *   object: import("./object").Object,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("./prelude").BodyPrelude
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").ConditionPrelude
 *   ),
 *   import("./object").Object
 * >}
 */
export const optionalizeObject = ({ path, meta }, object) => {
  if (object.type === "super") {
    return initSequence(
      [
        {
          type: "error",
          data: {
            message: "Illegal optional member access to super",
            origin: path,
          },
        },
      ],
      object,
    );
  } else if (object.type === "regular") {
    return bindSequence(cacheConstant(meta, object.data, path), (object) =>
      initSequence(
        [
          makeConditionPrelude({
            test: makeBinaryExpression(
              "==",
              makeReadCacheExpression(object, path),
              makePrimitiveExpression(null, path),
              path,
            ),
            exit: makeIntrinsicExpression("undefined", path),
          }),
        ],
        {
          type: "regular",
          data: makeReadCacheExpression(object, path),
        },
      ),
    );
  } else {
    throw new AranTypeError(object);
  }
};
