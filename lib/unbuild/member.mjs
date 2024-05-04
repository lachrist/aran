import { AranTypeError } from "../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "./scope/index.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "./early-error.mjs";
import { makeKeyExpression } from "./key.mjs";
import {
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../sequence.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { incorporatePrefixExpression } from "./prefix.mjs";
import { EMPTY, concat_ } from "../util/index.mjs";

/**
 * @type {(
 *   object: import("./object").Object,
 *   key: import("./key").Key,
 * ) => import("./member").GetMember}
 */
export const makeGetMember = (object, key) => ({ object, key });

/**
 * @type {(
 *   object: import("./object").Object,
 *   key: import("./key").Key,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => import("./member").SetMember}
 */
export const makeSetMember = (object, key, value) => ({ object, key, value });

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: import("./member").GetMember,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeGetMemberExpression = (
  { path, meta },
  scope,
  { object, key },
) => {
  const mode = getMode(scope);
  if (object.type === "super") {
    if (key.access === "private") {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal private member of super", path),
      );
    } else if (key.access === "public") {
      return makeScopeLoadExpression(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        { type: "get-super", mode, key: makeKeyExpression({ path }, key) },
      );
    } else {
      throw new AranTypeError(key);
    }
  } else if (object.type === "regular") {
    if (key.access === "private") {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "get-private",
        mode,
        target: object.data,
        key: key.data,
      });
    } else if (key.access === "public") {
      return zeroSequence(
        makeGetExpression(object.data, makeKeyExpression({ path }, key), path),
      );
    } else {
      throw new AranTypeError(key);
    }
  } else {
    throw new AranTypeError(object);
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: import("./member").SetMember,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listSetMemberEffect = (
  { path, meta },
  scope,
  { object, key, value },
) => {
  const mode = getMode(scope);
  switch (object.type) {
    case "super": {
      switch (key.access) {
        case "private": {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              makeEarlyErrorExpression(
                makeRegularEarlyError("Illegal private member of super", path),
              ),
              path,
            ),
          );
        }
        case "public": {
          return listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "set-super",
              mode,
              key: makeKeyExpression({ path }, key),
              value,
            },
          );
        }
        default: {
          throw new AranTypeError(key);
        }
      }
    }
    case "regular": {
      switch (key.access) {
        case "private": {
          return listScopeSaveEffect({ path, meta }, scope, {
            type: "set-private",
            mode,
            target: object.data,
            key: key.data,
            value,
          });
        }
        case "public": {
          return mapSequence(
            incorporatePrefixExpression(
              mapSequence(cacheConstant(meta, object.data, path), (object) =>
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.set", path),
                  makeIntrinsicExpression("undefined", path),
                  [
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(object, path),
                        makeIntrinsicExpression("undefined", path),
                        path,
                      ),
                      makeReadCacheExpression(object, path),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object", path),
                        makeIntrinsicExpression("undefined", path),
                        [makeReadCacheExpression(object, path)],
                        path,
                      ),
                      path,
                    ),
                    makeKeyExpression({ path }, key),
                    value,
                    makeReadCacheExpression(object, path),
                  ],
                  path,
                ),
              ),
              path,
            ),
            (action) => {
              switch (mode) {
                case "strict": {
                  return [
                    makeConditionalEffect(
                      action,
                      EMPTY,
                      [
                        makeExpressionEffect(
                          makeThrowErrorExpression(
                            "TypeError",
                            "Cannot assign to read only property",
                            path,
                          ),
                          path,
                        ),
                      ],
                      path,
                    ),
                  ];
                }
                case "sloppy": {
                  return [makeExpressionEffect(action, path)];
                }
                default: {
                  throw new AranTypeError(mode);
                }
              }
            },
          );
        }
        default: {
          throw new AranTypeError(key);
        }
      }
    }
    default: {
      throw new AranTypeError(object);
    }
  }
};
