import { AranTypeError } from "../report.mjs";
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
} from "./node.mjs";
import {
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "./scope/index.mjs";
import {
  incorporateExpression,
  initSyntaxErrorExpression,
} from "./prelude/index.mjs";
import { makeKeyExpression } from "./key.mjs";
import {
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../sequence.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { EMPTY, concat_ } from "../util/index.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   object: import("./object").Object,
 *   key: import("./key").Key,
 * ) => import("./member").GetMember}
 */
export const makeGetMember = (mode, object, key) => ({ mode, object, key });

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   object: import("./object").Object,
 *   key: import("./key").Key,
 *   value: import("./atom").Expression,
 * ) => import("./member").SetMember}
 */
export const makeSetMember = (mode, object, key, value) => ({
  mode,
  object,
  key,
  value,
});

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
 *   scope: import("./scope").Scope,
 *   options: import("./member").GetMember,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeGetMemberExpression = (
  hash,
  meta,
  scope,
  { mode, object, key },
) => {
  if (object.type === "super") {
    if (key.access === "private") {
      return initSyntaxErrorExpression("Illegal private member of super", hash);
    } else if (key.access === "public") {
      return makeScopeLoadExpression(
        hash,
        forkMeta((meta = nextMeta(meta))),
        scope,
        { type: "get-super", mode, key: makeKeyExpression(hash, key) },
      );
    } else {
      throw new AranTypeError(key);
    }
  } else if (object.type === "regular") {
    if (key.access === "private") {
      return makeScopeLoadExpression(hash, meta, scope, {
        type: "get-private",
        mode,
        target: object.data,
        key: key.data,
      });
    } else if (key.access === "public") {
      return zeroSequence(
        makeGetExpression(object.data, makeKeyExpression(hash, key), hash),
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
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
 *   scope: import("./scope").Scope,
 *   options: import("./member").SetMember,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   import("./atom").Effect[],
 * >}
 */
export const listSetMemberEffect = (
  hash,
  meta,
  scope,
  { mode, object, key, value },
) => {
  switch (object.type) {
    case "super": {
      switch (key.access) {
        case "private": {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression(
                "Illegal private member of super",
                hash,
              ),
              hash,
            ),
          );
        }
        case "public": {
          return listScopeSaveEffect(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            {
              type: "set-super",
              mode,
              key: makeKeyExpression(hash, key),
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
          return listScopeSaveEffect(hash, meta, scope, {
            type: "set-private",
            mode,
            target: object.data,
            key: key.data,
            value,
          });
        }
        case "public": {
          return mapSequence(
            incorporateExpression(
              mapSequence(cacheConstant(meta, object.data, hash), (object) =>
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.set", hash),
                  makeIntrinsicExpression("undefined", hash),
                  [
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(object, hash),
                        makeIntrinsicExpression("undefined", hash),
                        hash,
                      ),
                      makeReadCacheExpression(object, hash),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object", hash),
                        makeIntrinsicExpression("undefined", hash),
                        [makeReadCacheExpression(object, hash)],
                        hash,
                      ),
                      hash,
                    ),
                    makeKeyExpression(hash, key),
                    value,
                    makeReadCacheExpression(object, hash),
                  ],
                  hash,
                ),
              ),
              hash,
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
                            hash,
                          ),
                          hash,
                        ),
                      ],
                      hash,
                    ),
                  ];
                }
                case "sloppy": {
                  return [makeExpressionEffect(action, hash)];
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
