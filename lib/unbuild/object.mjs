import { AranTypeError } from "../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { zeroSequence, mapSequence } from "./sequence.mjs";

/**
 * @type {import("./object").Object}
 */
export const SUPER_OBJECT = {
  type: "super",
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   object: import("./object").Object,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").CachePrelude,
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
          ...object,
          data: makeReadCacheExpression(data, path),
        },
        {
          ...object,
          data: makeReadCacheExpression(data, path),
        },
      ]);
    }
    default: {
      throw new AranTypeError(object);
    }
  }
};
