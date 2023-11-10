import { makeSyntaxErrorExpression } from "../report.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../node.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { AranTypeError } from "../../util/error.mjs";

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (_context, object, { path }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", path),
      makeIntrinsicExpression("aran.private", path),
      [
        object,
        makeObjectExpression(
          makePrimitiveExpression({ undefined: null }, path),
          [],
          path,
        ),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDefinePrivateEffect = (
  { param: { privates: keys } },
  object,
  key,
  descriptor,
  { path },
) =>
  hasOwn(keys, key)
    ? [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [object],
                path,
              ),
              makeReadCacheExpression(
                /** @type {import("../cache.mjs").Cache} */ (keys[key]),
                path,
              ),
              descriptor,
            ],
            path,
          ),
          path,
        ),
      ]
    : [
        makeExpressionEffect(
          makeSyntaxErrorExpression(
            `Cannot define private member #${key}`,
            path,
          ),
          path,
        ),
      ];

/////////////////
// private.get //
/////////////////

/**
 * @type {(
 *   situ: "local" | "global",
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMissingPrivateGetExpression = (situ, object, key, path) => {
  switch (situ) {
    case "global": {
      return makeSyntaxErrorExpression(`Missing private member #${key}`, path);
    }
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("private.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path)],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid context.private.situ", situ);
    }
  }
};

/**
 * @type {(
 *   object: import("../cache.mjs").Cache,
 *   key: import("../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePresentPrivateGetExpression = (object, key, path) =>
  makeConditionalExpression(
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("WeakMap.prototype.has", path),
        makeIntrinsicExpression("aran.private", path),
        [makeReadCacheExpression(object, path)],
        path,
      ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get", path),
            makeIntrinsicExpression("aran.private", path),
            [makeReadCacheExpression(object, path)],
            path,
          ),
          makeReadCacheExpression(key, path),
        ],
        path,
      ),
      makePrimitiveExpression(false, path),
      path,
    ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeIntrinsicExpression("aran.private", path),
          [makeReadCacheExpression(object, path)],
          path,
        ),
        makeReadCacheExpression(key, path),
        makeReadCacheExpression(object, path),
      ],
      path,
    ),
    makeThrowErrorExpression(
      "TypeError",
      `Cannot get private member #${key}`,
      path,
    ),
    path,
  );

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (
  { param: { situ, privates: keys } },
  object,
  key,
  { path, meta },
) =>
  hasOwn(keys, key)
    ? makeInitCacheExpression("constant", object, { path, meta }, (object) =>
        makePresentPrivateGetExpression(
          object,
          /** @type {import("../cache.mjs").Cache} */ (keys[key]),
          path,
        ),
      )
    : makeMissingPrivateGetExpression(situ, object, key, path);

/////////////////
// private.set //
/////////////////

/**
 * @type {(
 *   situ: "local" | "global",
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMissingPrivateSetExpression = (situ, object, key, value, path) => {
  switch (situ) {
    case "global": {
      return makeSyntaxErrorExpression(`Missing private member #${key}`, path);
    }
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("private.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path), value],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid context.private.situ", situ);
    }
  }
};

/**
 * @type {(
 *   object: import("../cache.mjs").Cache,
 *   key: import("../cache.mjs").Cache,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePresentPrivateSetExpression = (object, key, value, path) =>
  makeConditionalExpression(
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("WeakMap.prototype.has", path),
        makeIntrinsicExpression("aran.private", path),
        [makeReadCacheExpression(object, path)],
        path,
      ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get", path),
            makeIntrinsicExpression("aran.private", path),
            [makeReadCacheExpression(object, path)],
            path,
          ),
          makeReadCacheExpression(key, path),
        ],
        path,
      ),
      makePrimitiveExpression(false, path),
      path,
    ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeIntrinsicExpression("aran.private", path),
          [makeReadCacheExpression(object, path)],
          path,
        ),
        makeReadCacheExpression(key, path),
        value,
        makeReadCacheExpression(object, path),
      ],
      path,
    ),
    makeThrowErrorExpression(
      "TypeError",
      `Cannot set private member #${key}`,
      path,
    ),
    path,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     param: Param,
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (
  { param: { situ, privates: keys } },
  object,
  key,
  value,
  { path, meta },
) =>
  hasOwn(keys, key)
    ? makeInitCacheExpression("constant", object, { path, meta }, (object) =>
        makePresentPrivateSetExpression(
          object,
          /** @type {import("../cache.mjs").Cache}*/
          (keys[key]),
          value,
          path,
        ),
      )
    : makeMissingPrivateSetExpression(situ, object, key, value, path);
