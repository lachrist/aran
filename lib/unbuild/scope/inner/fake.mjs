import { AranTypeError } from "../../../error.mjs";
import {
  hasOwn,
  listEntry,
  map,
  mapMaybe,
  pairup,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  listInitCacheEffect,
  listWriteCacheEffect,
  makeReadCacheExpression,
  mapSetup,
  sequenceSetup,
  setupCache,
} from "../../cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { zipMeta } from "../../mangle.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "./error.mjs";

/**
 * @typedef {import("./fake.d.ts").RawFakeFrame} RawFakeFrame
 */

/**
 * @typedef {import("./fake.d.ts").FakeFrame} FakeFrame
 */

/**
 * @template V
 * @typedef {import("../../cache.d.ts").Setup<V>} Setup
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *    frame: RawFakeFrame,
 *   },
 * ) => Setup<FakeFrame>}
 */
export const cookFakeFrame = ({ path, meta }, _context, { frame }) =>
  mapSetup(
    sequenceSetup(
      map(zipMeta(meta, listEntry(frame)), ([meta, [variable, kind]]) =>
        mapSetup(
          setupCache(
            "writable",
            kind === "var"
              ? makePrimitiveExpression({ undefined: null }, path)
              : makeIntrinsicExpression("aran.deadzone", path),
            { path, meta },
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
 *     frame: FakeFrame,
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom> | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listInitializeFakeFrameEffect = (
  { path },
  _context,
  { frame, variable, right },
) => {
  if (hasOwn(frame, variable)) {
    const { proxy } = frame[variable];
    return listWriteCacheEffect(
      proxy,
      right ?? makePrimitiveExpression({ undefined: null }, path),
      path,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: FakeFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeDiscardFakeFrameExpression = (
  { path },
  _context,
  { frame, variable },
) => {
  if (hasOwn(frame, variable)) {
    return makePrimitiveExpression(false, path);
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: FakeFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeReadFakeFrameExpression = (
  { path },
  _context,
  { frame, variable },
) => {
  if (hasOwn(frame, variable)) {
    const { kind, proxy } = frame[variable];
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
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: FakeFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeTypeofFakeFrameExpression = ({ path }, context, options) =>
  mapMaybe(makeReadFakeFrameExpression({ path }, context, options), (node) =>
    makeUnaryExpression("typeof", node, path),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     frame: FakeFrame,
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listWriteFakeFrameEffect = (
  { path, meta },
  _context,
  { frame, variable, right },
) => {
  if (hasOwn(frame, variable)) {
    const { kind, proxy } = frame[variable];
    if (kind === "var") {
      return listWriteCacheEffect(proxy, right, path);
    } else if (kind === "let" || kind === "const") {
      return listInitCacheEffect("constant", right, { path, meta }, (right) => [
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(variable, path),
              path,
            ),
          ],
          {
            let: listWriteCacheEffect(
              proxy,
              makeReadCacheExpression(right, path),
              path,
            ),
            const: [
              makeExpressionEffect(
                makeThrowConstantExpression(variable, path),
                path,
              ),
            ],
          }[kind],
          path,
        ),
      ]);
    } else {
      throw new AranTypeError("invalid kind", kind);
    }
  } else {
    return null;
  }
};
