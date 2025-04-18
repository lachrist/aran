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
} from "./node.mjs";
import {
  incorporateExpression,
  initSyntaxErrorExpression,
} from "./prelude/index.mjs";
import { makeKeyExpression } from "./key.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  EMPTY,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../util/index.mjs";
import {
  listSetPrivateEffect,
  listSetSuperEffect,
  makeGetPrivateExpression,
  makeGetSuperExpression,
} from "./scope/index.mjs";

/**
 * @type {(
 *   object: import("./object.d.ts").Object,
 *   key: import("./key.d.ts").Key,
 * ) => import("./member.d.ts").GetMember}
 */
export const makeGetMember = (object, key) => ({ object, key });

/**
 * @type {(
 *   object: import("./object.d.ts").Object,
 *   key: import("./key.d.ts").Key,
 *   value: import("./atom.d.ts").Expression,
 * ) => import("./member.d.ts").SetMember}
 */
export const makeSetMember = (object, key, value) => ({
  object,
  key,
  value,
});

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   scope: import("./scope/index.d.ts").Scope,
 *   options: import("./member.d.ts").GetMember,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").BodyPrelude,
 *   import("./atom.d.ts").Expression,
 * >}
 */
export const makeGetMemberExpression = (hash, meta, scope, { object, key }) => {
  if (object.type === "super") {
    if (key.access === "private") {
      return initSyntaxErrorExpression("Illegal private member of super", hash);
    } else if (key.access === "public") {
      return makeGetSuperExpression(
        hash,
        forkMeta((meta = nextMeta(meta))),
        scope,
        { key: makeKeyExpression(hash, key) },
      );
    } else {
      throw new AranTypeError(key);
    }
  } else if (object.type === "regular") {
    if (key.access === "private") {
      return makeGetPrivateExpression(hash, meta, scope, {
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
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   scope: import("./scope/index.d.ts").Scope,
 *   options: import("./member.d.ts").SetMember,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").BodyPrelude,
 *   import("../util/tree.d.ts").Tree<import("./atom.d.ts").Effect>,
 * >}
 */
export const listSetMemberEffect = (
  hash,
  meta,
  scope,
  { object, key, value },
) => {
  switch (object.type) {
    case "super": {
      switch (key.access) {
        case "private": {
          return liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal private member of super", hash),
            hash,
          );
        }
        case "public": {
          return listSetSuperEffect(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            {
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
          return listSetPrivateEffect(hash, meta, scope, {
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
              switch (scope.mode) {
                case "strict": {
                  return makeConditionalEffect(
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
                  );
                }
                case "sloppy": {
                  return makeExpressionEffect(action, hash);
                }
                default: {
                  throw new AranTypeError(scope.mode);
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
