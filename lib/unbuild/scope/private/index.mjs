import { AranError } from "../../../error.mjs";
import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeThrowErrorExpression } from "../../intrinsic.mjs";
import { splitMeta, zipMeta } from "../../mangle.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
} from "./binding.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {Record<import(".").PrivateFrame["type"], null>}
 */
export const PRIVATE = {
  private: null,
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   entries: [
 *     key: estree.PrivateKey,
 *     binding: import(".").PackPrivateBinding
 *   ][],
 * ) => import("../../../util/outcome.js").Outcome<
 *   Record<estree.PrivateKey, import(".").PackPrivateBinding>,
 *   string
 * >}
 */
const combinePrivateBinding = (entries) => {
  /**
   * @type {Record<estree.PrivateKey, import(".").PackPrivateBinding>}
   */
  const record = {};
  for (const [key, new_binding] of entries) {
    if (hasOwn(record, key)) {
      const old_binding = record[key];
      if (new_binding.type !== "accessor" || old_binding.type !== "accessor") {
        return {
          type: "failure",
          error: `Duplicate private field #${key}`,
        };
      }
      if (new_binding.getter !== null && old_binding.getter !== null) {
        return {
          type: "failure",
          error: `Duplicate private field #${key}`,
        };
      }
      if (new_binding.setter !== null && old_binding.setter !== null) {
        return {
          type: "failure",
          error: `Duplicate private field #${key}`,
        };
      }
      defineProperty(record, key, {
        value: {
          ...old_binding,
          getter: new_binding.getter ?? old_binding.getter,
          setter: new_binding.setter ?? old_binding.setter,
        },
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      defineProperty(record, key, {
        value: new_binding,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  return { type: "success", value: record };
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kind: import(".").PrivateKind,
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").PackPrivateBinding,
 * >}
 */
const packBinding = ({ path, meta }, kind) => {
  if (kind === "property") {
    return mapSequence(
      cacheWritable(
        meta,
        makeConstructExpression(
          makeIntrinsicExpression("WeakMap", path),
          [],
          path,
        ),
        path,
      ),
      (weakmap) => ({
        type: "property",
        weakmap,
      }),
    );
  } else if (kind === "method") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (method) => ({
        type: "method",
        method,
      }),
    );
  } else if (kind === "getter") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (getter) => ({
        type: "accessor",
        getter,
        setter: null,
      }),
    );
  } else if (kind === "setter") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (setter) => ({
        type: "accessor",
        getter: null,
        setter,
      }),
    );
  } else {
    throw new AranError("invalid private binding kind", kind);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   entries: import(".").RawPrivateFrame,
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").PrivateFrame,
 * >}
 */
export const setupPrivateFrame = ({ path, meta }, entries) => {
  const metas = splitMeta(meta, ["weakset", "bindings"]);
  return bindSequence(
    cacheConstant(
      metas.weakset,
      makeConstructExpression(
        makeIntrinsicExpression("WeakSet", path),
        [],
        path,
      ),
      path,
    ),
    (weakset) =>
      bindSequence(
        flatSequence(
          map(zipMeta(metas.bindings, entries), ([meta, [key, kind]]) =>
            mapSequence(packBinding({ path, meta }, kind), (binding) =>
              pairup(key, binding),
            ),
          ),
        ),
        (entries) => {
          const outcome = combinePrivateBinding(entries);
          if (outcome.type === "failure") {
            return initSequence(
              [
                makeExpressionEffect(
                  makeSyntaxErrorExpression(outcome.error, path),
                  path,
                ),
              ],
              {
                type: /** @type {"private"} */ ("private"),
                weakset,
                record: {},
              },
            );
          } else if (outcome.type === "success") {
            return zeroSequence({
              type: /** @type {"private"} */ ("private"),
              weakset,
              record: outcome.value,
            });
          } else {
            throw new AranError("invalid outcome", outcome);
          }
        },
      ),
  );
};

/**
 * @type {(
 *   binding: import(".").PackPrivateBinding,
 *   weakset: import("../../cache").Cache,
 * ) => import(".").PrivateBinding}
 */
const unpackBinding = (binding, weakset) => {
  if (binding.type === "property") {
    return binding;
  } else if (binding.type === "method" || binding.type === "accessor") {
    return {
      ...binding,
      weakset,
    };
  } else {
    throw new AranError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").PrivateFrame,
 *   operation: import("..").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listPrivateSaveEffect = ({ path }, frame, operation) => {
  if (operation.type === "register-private") {
    return [
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("WeakSet.prototype.has", path),
          makeReadCacheExpression(frame.weakset, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Duplicate private registration",
              path,
            ),
            path,
          ),
        ],
        [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakSet.prototype.add", path),
              makeReadCacheExpression(frame.weakset, path),
              [makeReadCacheExpression(operation.target, path)],
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ];
  } else if (
    operation.type === "set-private" ||
    operation.type === "define-private" ||
    operation.type === "initialize-private"
  ) {
    if (hasOwn(frame.record, operation.key)) {
      return listBindingSaveEffect(
        { path },
        unpackBinding(frame.record[operation.key], frame.weakset),
        operation,
      );
    } else {
      return null;
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").PrivateFrame,
 *   operation: import("..").LoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makePrivateLoadExpression = ({ path }, frame, operation) => {
  if (operation.type === "has-private" || operation.type === "get-private") {
    if (hasOwn(frame.record, operation.key)) {
      return makeBindingLoadExpression(
        { path },
        unpackBinding(frame.record[operation.key], frame.weakset),
        operation,
      );
    } else {
      return null;
    }
  } else {
    return null;
  }
};
