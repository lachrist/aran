import { AranTypeError } from "../error.mjs";
import { guard, mapSequence, zeroSequence } from "../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "./intrinsic.mjs";
import { convertKey } from "./key.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { incorporateExpression } from "./prelude/index.mjs";

const KIND_PREFIX = {
  init: "",
  env: "",
  get: "get ",
  set: "set ",
};

const ACCESS_PREFIX = {
  public: "",
  private: "#",
};

/** @type {import("./name").Name} */
export const ANONYMOUS_NAME = {
  type: "anonymous",
};

/** @type {import("./name").Name} */
export const DEFAULT_NAME = {
  type: "default",
};

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
 *   name: import("./name").Name,
 * ) => import("../util/sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeNameExpression = (hash, meta, name) => {
  if (name.type === "assignment") {
    return zeroSequence(makePrimitiveExpression(name.variable, hash));
  } else if (name.type === "anonymous") {
    return zeroSequence(makePrimitiveExpression("", hash));
  } else if (name.type === "default") {
    return zeroSequence(makePrimitiveExpression("default", hash));
  } else if (name.type === "property") {
    const key = convertKey(hash, name.key);
    if (key.computed) {
      return incorporateExpression(
        mapSequence(cacheConstant(meta, key.data, hash), (key) =>
          guard(
            KIND_PREFIX[name.kind] !== "",
            (node) =>
              makeBinaryExpression(
                "+",
                makePrimitiveExpression(KIND_PREFIX[name.kind], hash),
                node,
                hash,
              ),
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeUnaryExpression(
                  "typeof",
                  makeReadCacheExpression(key, hash),
                  hash,
                ),
                makePrimitiveExpression("symbol", hash),
                hash,
              ),
              makeConditionalExpression(
                makeBinaryExpression(
                  "==",
                  makeApplyExpression(
                    makeIntrinsicExpression(
                      "Symbol.prototype.description@get",
                      hash,
                    ),
                    makeReadCacheExpression(key, hash),
                    [],
                    hash,
                  ),
                  makePrimitiveExpression(null, hash),
                  hash,
                ),
                makePrimitiveExpression("", hash),
                makeBinaryExpression(
                  "+",
                  makeBinaryExpression(
                    "+",
                    makePrimitiveExpression("[", hash),
                    makeApplyExpression(
                      makeIntrinsicExpression(
                        "Symbol.prototype.description@get",
                        hash,
                      ),
                      makeReadCacheExpression(key, hash),
                      [],
                      hash,
                    ),
                    hash,
                  ),
                  makePrimitiveExpression("]", hash),
                  hash,
                ),
                hash,
              ),
              makeReadCacheExpression(key, hash),
              hash,
            ),
          ),
        ),
        hash,
      );
    } else {
      return zeroSequence(
        makePrimitiveExpression(
          `${KIND_PREFIX[name.kind]}${ACCESS_PREFIX[key.access]}${key.data}`,
          hash,
        ),
      );
    }
  } else {
    throw new AranTypeError(name);
  }
};
