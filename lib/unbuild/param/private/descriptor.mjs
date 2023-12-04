import { AranError, AranTypeError } from "../../../error.mjs";
import { hasOwn } from "../../../util/index.mjs";
import {
  makeReadCacheExpression,
  listWriteCacheEffect,
  cacheWritable,
} from "../../cache.mjs";
import { makeThrowErrorExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";
import { mapSequence } from "../../sequence.mjs";

/** @type {<X>(x1: X | null, x2: X | null) => X | null} */
const xor = (x1, x2) => {
  if (x1 === null) {
    return x2;
  }
  if (x2 === null) {
    return x1;
  }
  return null;
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     kind: "method" | "get" | "set",
 *   },
 * ) => import("../../sequence.d.ts").EffectSequence<
 *   import("./descriptor.d.ts").PrivateDescriptor
 * >}
 */
export const setupPrivateDescriptor = ({ path, meta }, _context, { kind }) =>
  mapSequence(
    cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
    (method) => {
      switch (kind) {
        case "method": {
          return { type: "method", method };
        }
        case "get": {
          return { type: "accessor", get: method, set: null };
        }
        case "set": {
          return { type: "accessor", get: null, set: method };
        }
        default: {
          throw new AranTypeError("invalid private descriptor kind", kind);
        }
      }
    },
  );

/**
 * @type {(
 *   old_descriptor: import("./descriptor.d.ts").PrivateDescriptor,
 *   new_descriptor2: import("./descriptor.d.ts").PrivateDescriptor,
 * ) => import("./descriptor.d.ts").PrivateDescriptor | null}
 */
export const overwritePrivateDescriptor = (old_descriptor, new_descriptor) => {
  if (
    old_descriptor.type === "accessor" &&
    new_descriptor.type === "accessor"
  ) {
    const get = xor(old_descriptor.get, new_descriptor.get);
    const set = xor(old_descriptor.set, new_descriptor.set);
    if (get !== null && set !== null) {
      return { type: "accessor", get, set };
    } else {
      return null;
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: "method" | "get" | "set",
 *   descriptor: import("./descriptor.d.ts").PrivateDescriptor,
 * ) => import("../../cache.d.ts").WritableCache}
 */
const getMethod = (kind, descriptor) => {
  if (hasOwn(descriptor, kind)) {
    return /** @type {any} */ (descriptor)[kind];
  } else {
    throw new AranError("private descriptor mismatch", { kind, descriptor });
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     kind: "method" | "get" | "set",
 *     descriptor: import("./descriptor.d.ts").PrivateDescriptor,
 *     value: import("../../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializePrivateDescriptorEffect = (
  { path },
  _context,
  { kind, descriptor, value },
) =>
  listWriteCacheEffect(
    getMethod(kind, descriptor),
    makeReadCacheExpression(value, path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     descriptor: import("./descriptor.d.ts").PrivateDescriptor,
 *     target: import("../../cache.d.ts").Cache,
 *     key: estree.PrivateKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateDescriptorExpression = (
  { path },
  _context,
  { descriptor, target, key },
) => {
  switch (descriptor.type) {
    case "accessor": {
      if (descriptor.get === null) {
        return makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${key}`,
          path,
        );
      } else {
        return makeApplyExpression(
          makeReadCacheExpression(descriptor.get, path),
          makeReadCacheExpression(target, path),
          [],
          path,
        );
      }
    }
    case "method": {
      return makeReadCacheExpression(descriptor.method, path);
    }
    default: {
      throw new AranTypeError(
        "invalid constant private descriptor",
        descriptor,
      );
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     descriptor: import("./descriptor.d.ts").PrivateDescriptor,
 *     target: import("../../cache.d.ts").Cache,
 *     key: estree.PrivateKey,
 *     value: import("../../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetPrivateDescriptorEffect = (
  { path },
  _context,
  { target, key, descriptor, value },
) => {
  switch (descriptor.type) {
    case "accessor": {
      if (descriptor.set === null) {
        return [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private accessor #${key}`,
              path,
            ),
            path,
          ),
        ];
      } else {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeReadCacheExpression(descriptor.set, path),
              makeReadCacheExpression(target, path),
              [makeReadCacheExpression(value, path)],
              path,
            ),
            path,
          ),
        ];
      }
    }
    case "method": {
      return [
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private method #${key}`,
            path,
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError(
        "invalid constant private descriptor",
        descriptor,
      );
    }
  }
};
