import { guard } from "../util/index.mjs";
import { makeReadCacheExpression } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { makeSyntaxErrorExpression } from "./syntax-error.mjs";

/**
 * @typedef {import("./key.d.ts").Key} Key
 */

const KIND_PREFIX = {
  init: "",
  method: "",
  get: "get ",
  set: "set ",
};

const ACCESS_PREFIX = {
  public: "",
  private: "#",
};

/**
 * @type {(
 *   key: Key,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadKeyExpression = (key, path) =>
  key.computed
    ? makeReadCacheExpression(key.value, path)
    : makePrimitiveExpression(`${ACCESS_PREFIX[key.access]}${key.value}`, path);

/**
 * @type {(
 *   key: Key,
 *   kind: "init" | "method" | "get" | "set",
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNameKeyExpression = (key, kind, path) => {
  if (key.computed) {
    return guard(
      KIND_PREFIX[kind] !== "",
      (node) =>
        makeBinaryExpression(
          "+",
          makePrimitiveExpression(KIND_PREFIX[kind], path),
          node,
          path,
        ),
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(key.value, path),
            path,
          ),
          makePrimitiveExpression("symbol", path),
          path,
        ),
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeApplyExpression(
              makeIntrinsicExpression("Symbol.prototype.description@get", path),
              makeReadCacheExpression(key.value, path),
              [],
              path,
            ),
            makePrimitiveExpression(null, path),
            path,
          ),
          makePrimitiveExpression("", path),
          makeBinaryExpression(
            "+",
            makeBinaryExpression(
              "+",
              makePrimitiveExpression("[", path),
              makeApplyExpression(
                makeIntrinsicExpression(
                  "Symbol.prototype.description@get",
                  path,
                ),
                makeReadCacheExpression(key.value, path),
                [],
                path,
              ),
              path,
            ),
            makePrimitiveExpression("]", path),
            path,
          ),
          path,
        ),
        makeReadCacheExpression(key.value, path),
        path,
      ),
    );
  } else {
    return makePrimitiveExpression(
      `${KIND_PREFIX[kind]}${ACCESS_PREFIX[key.access]}${key.value}`,
      path,
    );
  }
};

/**
 * @type {(
 *   key: Key,
 *   path: unbuild.Path,
 *   valid: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCheckStaticKeyExpression = (key, path, valid) => {
  if (key.computed) {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadCacheExpression(key.value, path),
        makePrimitiveExpression("prototype", path),
        path,
      ),
      makeThrowErrorExpression(
        "TypeError",
        "Illegal computed static key: 'prototype'",
        path,
      ),
      valid,
      path,
    );
  } else {
    return key.access === "public" && key.value === "prototype"
      ? makeSyntaxErrorExpression(
          "Illegal non-computed static key: 'prototype'",
          path,
        )
      : valid;
  }
};
