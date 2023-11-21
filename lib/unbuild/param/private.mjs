import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { guard, hasOwn } from "../../util/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import {
  makeLongSequenceExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeSequenceExpression,
} from "../node.mjs";
import {
  listImpureEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeIsProperObjectExpression } from "../helper.mjs";

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
 */

/**
 * @typedef {import("../context.d.ts").Context} Context
 */

/**
 * @typedef {import("./private.d.ts").PrivateDescriptor} PrivateDescriptor
 */

/**
 * @typedef {import("./private.d.ts").Private} Private
 */

/////////////
// declare //
/////////////

/**
 * @type {<C extends { private: Private }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     key: estree.PrivateKey,
 *     descriptor: {
 *       type: "field" | "method",
 *     } | {
 *       type: "accessor",
 *       getter: boolean,
 *       setter: boolean,
 *     },
 *     kontinue: (context: C) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const declarePrivate = (
  { path, meta },
  context,
  { key, descriptor, kontinue },
) => {
  switch (descriptor.type) {
    case "method": {
      const metas = splitMeta(meta, ["allow", "method"]);
      return makeInitCacheExpression(
        "constant",
        makeConstructExpression(
          makeIntrinsicExpression("WeakSet", path),
          [],
          path,
        ),
        { path, meta: metas.allow },
        (allow) =>
          makeInitCacheExpression(
            "writable",
            makePrimitiveExpression({ undefined: null }, path),
            { path, meta: metas.method },
            (method) =>
              kontinue({
                ...context,
                private: {
                  ...context.private,
                  [key]: { type: "method", allow, method },
                },
              }),
          ),
      );
    }
    case "field": {
      return makeInitCacheExpression(
        "constant",
        makeConstructExpression(
          makeIntrinsicExpression("WeakMap", path),
          [],
          path,
        ),
        { path, meta },
        (store) =>
          kontinue({
            ...context,
            private: { ...context.private, [key]: { type: "field", store } },
          }),
      );
    }
    case "accessor": {
      const metas = splitMeta(meta, ["allow", "getter", "setter"]);
      return makeInitCacheExpression(
        "constant",
        makeConstructExpression(
          makeIntrinsicExpression("WeakSet", path),
          [],
          path,
        ),
        { path, meta: metas.allow },
        (allow) =>
          guard(
            descriptor.getter,
            (kontinue) => (_getter) =>
              makeInitCacheExpression(
                "writable",
                makePrimitiveExpression({ undefined: null }, path),
                { path, meta: metas.getter },
                kontinue,
              ),
            /** @type {(getter: Cache | null) => aran.Expression<unbuild.Atom>} */
            (
              (getter) =>
                guard(
                  descriptor.setter,
                  (kontinue) => (_setter) =>
                    makeInitCacheExpression(
                      "writable",
                      makePrimitiveExpression({ undefined: null }, path),
                      { path, meta: metas.setter },
                      kontinue,
                    ),
                  /** @type {(getter: Cache | null) => aran.Expression<unbuild.Atom>} */
                  (
                    (setter) =>
                      kontinue({
                        ...context,
                        private: {
                          ...context.private,
                          [key]: { type: "accessor", allow, getter, setter },
                        },
                      })
                  ),
                )(null)
            ),
          )(null),
      );
    }
    default: {
      throw new AranTypeError("invalid private descriptor", descriptor);
    }
  }
};

////////////////
// initialize //
////////////////

/**
 * @type {<C extends { private: Private }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     key: estree.PrivateKey,
 *     descriptor: {
 *       type: "method" | "get" | "set",
 *       value: aran.Expression<unbuild.Atom>,
 *     },
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializePrivateEffect = (
  { path },
  context,
  { key, descriptor: descriptor1 },
) => {
  if (hasOwn(context.private, key)) {
    const descriptor2 = context.private[key];
    switch (descriptor1.type) {
      case "method": {
        if (descriptor2.type !== "method") {
          throw new AranError(
            "expected a private method descriptor",
            descriptor2,
          );
        } else {
          return [
            makeWriteCacheEffect(descriptor2.method, descriptor1.value, path),
          ];
        }
      }
      case "get": {
        if (descriptor2.type !== "accessor" || descriptor2.getter === null) {
          throw new AranError(
            "expected a private getter descriptor",
            descriptor2,
          );
        } else {
          return [
            makeWriteCacheEffect(descriptor2.getter, descriptor1.value, path),
          ];
        }
      }
      case "set": {
        if (descriptor2.type !== "accessor" || descriptor2.setter === null) {
          throw new AranError(
            "expected a private setter descriptor",
            descriptor2,
          );
        } else {
          return [
            makeWriteCacheEffect(descriptor2.setter, descriptor1.value, path),
          ];
        }
      }
      default: {
        throw new AranTypeError(
          "invalid initializable private descriptor type",
          descriptor1.type,
        );
      }
    }
  } else {
    throw new AranError("missing private key", {
      private: context.private,
      key,
    });
  }
};

//////////////
// register //
//////////////

/**
 * @type {<C extends { private: Private }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     key: estree.PrivateKey,
 *     object: aran.Expression<unbuild.Atom>,
 *     descriptor: {
 *       type: "field",
 *       value: aran.Expression<unbuild.Atom>,
 *     } | {
 *       type: "method" | "accessor",
 *     },
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegisterPrivateEffect = (
  { path },
  context,
  { key, object, descriptor: descriptor1 },
) => {
  if (hasOwn(context.private, key)) {
    const descriptor2 = context.private[key];
    if (descriptor1.type === "field") {
      if (descriptor2.type !== "field") {
        throw new AranError("expected a private field descriptor", {
          descriptor1,
          descriptor2,
        });
      } else {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.set", path),
              makeReadCacheExpression(descriptor2.store, path),
              [object, descriptor1.value],
              path,
            ),
            path,
          ),
        ];
      }
    } else {
      if (descriptor2.type !== descriptor1.type) {
        throw new AranError("private descriptor mismatch", {
          descriptor1,
          descriptor2,
        });
      } else {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakSet.prototype.add", path),
              makeReadCacheExpression(descriptor2.allow, path),
              [object],
              path,
            ),
            path,
          ),
        ];
      }
    }
  } else {
    throw new AranError("missing private key", {
      private: context.private,
      key,
    });
  }
};

/////////
// get //
/////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     object: aran.Expression<unbuild.Atom>,
 *     key: estree.PrivateKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (
  { path, meta },
  { root: { situ }, private: private_ },
  { object, key },
) => {
  if (hasOwn(private_, key)) {
    const descriptor = private_[key];
    switch (descriptor.type) {
      case "method": {
        return makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakSet.prototype.has", path),
            makeReadCacheExpression(descriptor.allow, path),
            [object],
            path,
          ),
          makeReadCacheExpression(descriptor.method, path),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private method #${key}`,
            path,
          ),
          path,
        );
      }
      case "field": {
        return makeInitCacheExpression(
          "constant",
          object,
          { path, meta },
          (object) =>
            makeConditionalExpression(
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.has", path),
                makeReadCacheExpression(descriptor.store, path),
                [makeReadCacheExpression(object, path)],
                path,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeReadCacheExpression(descriptor.store, path),
                [makeReadCacheExpression(object, path)],
                path,
              ),
              makeThrowErrorExpression(
                "TypeError",
                `Cannot get private field #${key}`,
                path,
              ),
              path,
            ),
        );
      }
      case "accessor": {
        return descriptor.getter === null
          ? makeLongSequenceExpression(
              listImpureEffect(object, path),
              makeThrowErrorExpression(
                "TypeError",
                `Missing getter for private accessor #${key}`,
                path,
              ),
              path,
            )
          : makeConditionalExpression(
              makeApplyExpression(
                makeIntrinsicExpression("WeakSet.prototype.has", path),
                makeReadCacheExpression(descriptor.allow, path),
                [object],
                path,
              ),
              makeApplyExpression(
                makeReadCacheExpression(descriptor.getter, path),
                object,
                [],
                path,
              ),
              makeThrowErrorExpression(
                "TypeError",
                `Cannot get private accessor #${key}`,
                path,
              ),
              path,
            );
      }
      default: {
        throw new AranTypeError("invalid private descriptor", descriptor);
      }
    }
  } else {
    switch (situ) {
      case "global": {
        return makeSyntaxErrorExpression(
          `Missing private member #${key}`,
          path,
        );
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
  }
};

/////////////////
// private.has //
/////////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     object: aran.Expression<unbuild.Atom>,
 *     key: estree.PrivateKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHasPrivateExpression = (
  { path, meta },
  { root: { situ }, private: private_ },
  { object, key },
) => {
  if (hasOwn(private_, key)) {
    const descriptor = private_[key];
    return makeInitCacheExpression(
      "constant",
      object,
      { path, meta },
      (object) =>
        makeConditionalExpression(
          makeIsProperObjectExpression({ path }, { value: object }),
          makeApplyExpression(
            makeIntrinsicExpression(
              descriptor.type === "field"
                ? "WeakMap.prototype.has"
                : "WeakSet.prototype.has",
              path,
            ),
            makeReadCacheExpression(
              descriptor.type === "field" ? descriptor.store : descriptor.allow,
              path,
            ),
            [makeReadCacheExpression(object, path)],
            path,
          ),
          makeThrowErrorExpression(
            "TypeError",
            "Cannot access private property of non-object",
            path,
          ),
          path,
        ),
    );
  } else {
    switch (situ) {
      case "global": {
        return makeSyntaxErrorExpression(
          `Missing private member #${key}`,
          path,
        );
      }
      case "local": {
        return makeApplyExpression(
          makeReadParameterExpression("private.has", path),
          makePrimitiveExpression({ undefined: null }, path),
          [object, makePrimitiveExpression(key, path)],
          path,
        );
      }
      default: {
        throw new AranTypeError("invalid context.private.situ", situ);
      }
    }
  }
};

/////////////////
// private.set //
/////////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     object: aran.Expression<unbuild.Atom>,
 *     key: estree.PrivateKey,
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (
  { path, meta },
  { root: { situ }, private: private_ },
  { object, key, value },
) => {
  if (hasOwn(private_, key)) {
    const descriptor = private_[key];
    switch (descriptor.type) {
      case "method": {
        return makeLongSequenceExpression(
          [...listImpureEffect(object, path), ...listImpureEffect(value, path)],
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private method #${key}`,
            path,
          ),
          path,
        );
      }
      case "field": {
        const metas = splitMeta(meta, ["object", "value"]);
        return makeInitCacheExpression(
          "constant",
          object,
          { path, meta: metas.object },
          (object) =>
            makeInitCacheExpression(
              "constant",
              value,
              { path, meta: metas.value },
              (value) =>
                makeConditionalExpression(
                  makeApplyExpression(
                    makeIntrinsicExpression("WeakMap.prototype.has", path),
                    makeReadCacheExpression(descriptor.store, path),
                    [makeReadCacheExpression(object, path)],
                    path,
                  ),
                  makeSequenceExpression(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("WeakMap.prototype.set", path),
                        makeReadCacheExpression(descriptor.store, path),
                        [
                          makeReadCacheExpression(object, path),
                          makeReadCacheExpression(value, path),
                        ],
                        path,
                      ),
                      path,
                    ),
                    makeReadCacheExpression(value, path),
                    path,
                  ),
                  makeThrowErrorExpression(
                    "TypeError",
                    `Cannot set private method #${key}`,
                    path,
                  ),
                  path,
                ),
            ),
        );
      }
      case "accessor": {
        if (descriptor.setter === null) {
          return makeLongSequenceExpression(
            [
              ...listImpureEffect(object, path),
              ...listImpureEffect(value, path),
            ],
            makeThrowErrorExpression(
              "TypeError",
              `Missing setter for private accessor #${key}`,
              path,
            ),
            path,
          );
        } else {
          const TS_NARROW = descriptor.setter;
          const metas = splitMeta(meta, ["object", "value"]);
          return makeInitCacheExpression(
            "constant",
            object,
            { path, meta: metas.object },
            (object) =>
              makeInitCacheExpression(
                "constant",
                value,
                { path, meta: metas.value },
                (value) =>
                  makeConditionalExpression(
                    makeApplyExpression(
                      makeIntrinsicExpression("WeakSet.prototype.has", path),
                      makeReadCacheExpression(descriptor.allow, path),
                      [makeReadCacheExpression(object, path)],
                      path,
                    ),
                    makeSequenceExpression(
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadCacheExpression(TS_NARROW, path),
                          makeReadCacheExpression(object, path),
                          [makeReadCacheExpression(value, path)],
                          path,
                        ),
                        path,
                      ),
                      makeReadCacheExpression(value, path),
                      path,
                    ),
                    makeThrowErrorExpression(
                      "TypeError",
                      `Cannot get private accessor #${key}`,
                      path,
                    ),
                    path,
                  ),
              ),
          );
        }
      }
      default: {
        throw new AranTypeError("invalid private descriptor", descriptor);
      }
    }
  } else {
    switch (situ) {
      case "global": {
        return makeSyntaxErrorExpression(
          `Missing private member #${key}`,
          path,
        );
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
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     object: aran.Expression<unbuild.Atom>,
 *     key: estree.PrivateKey,
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetPrivateEffect = ({ path, meta }, context, options) => [
  makeExpressionEffect(
    makeSetPrivateExpression({ path, meta }, context, options),
    path,
  ),
];
