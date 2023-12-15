import { AranTypeError } from "../../../error.mjs";
import { listEntry, map, pairup, reduceEntry } from "../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { zipMeta } from "../../mangle.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { flatSequence, mapSequence, passSequence } from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *    record: Record<estree.Variable, import("./fake.d.ts").RawFakeBinding>,
 *   },
 * ) => import("../../sequence.js").BlockSequence<
 *   Record<estree.Variable, import("./fake.d.ts").FakeBinding>
 * >}
 */
export const sequenceFakeFrame = ({ path, meta }, _context, { record }) =>
  mapSequence(
    flatSequence(
      map(zipMeta(meta, listEntry(record)), ([meta, [variable, kind]]) =>
        mapSequence(
          passSequence(
            cacheWritable(
              meta,
              kind === "var"
                ? makePrimitiveExpression({ undefined: null }, path)
                : makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            (node) => makeEffectStatement(node, path),
          ),
          (proxy) => pairup(variable, { kind, proxy }),
        ),
      ),
    ),
    reduceEntry,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import("./fake.d.ts").FakeBinding,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache| null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listFakeSaveEffect = (
  { path },
  _context,
  { operation, binding, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      if (right === null && binding.kind === "var") {
        return [];
      } else {
        return listWriteCacheEffect(
          binding.proxy,
          right === null
            ? makePrimitiveExpression({ undefined: null }, path)
            : makeReadCacheExpression(right, path),
          path,
        );
      }
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
        switch (binding.kind) {
          case "var": {
            return listWriteCacheEffect(
              binding.proxy,
              makeReadCacheExpression(right, path),
              path,
            );
          }
          case "let": {
            return [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(binding.proxy, path),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowDeadzoneExpression(variable, path),
                    path,
                  ),
                ],
                listWriteCacheEffect(
                  binding.proxy,
                  makeReadCacheExpression(right, path),
                  path,
                ),
                path,
              ),
            ];
          }
          case "const": {
            return [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(binding.proxy, path),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowDeadzoneExpression(variable, path),
                    path,
                  ),
                ],
                [
                  makeExpressionEffect(
                    makeThrowConstantExpression(variable, path),
                    path,
                  ),
                ],
                path,
              ),
            ];
          }
          default: {
            throw new AranTypeError("invalid binding.kind", binding.kind);
          }
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
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
 *     operation: "read" | "typeof" | "discard",
 *     binding: import("./fake.d.ts").FakeBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFakeLoadExpression = (
  { path },
  context,
  { operation, binding: { kind, proxy }, variable },
) => {
  switch (operation) {
    case "read": {
      if (kind === "var") {
        return makeReadCacheExpression(proxy, path);
      } else if (kind === "let" || kind === "const") {
        return makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeReadCacheExpression(proxy, path),
          path,
        );
      } else {
        throw new AranTypeError("invalid kind", kind);
      }
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeFakeLoadExpression({ path }, context, {
          operation: "read",
          binding: { kind, proxy },
          variable,
        }),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError("invalid operation", operation);
    }
  }
};
