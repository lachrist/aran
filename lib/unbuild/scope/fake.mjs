import { AranTypeError } from "../../error.mjs";
import {
  hasOwn,
  listEntry,
  map,
  mapMaybe,
  pairup,
  reduceEntry,
} from "../../util/index.mjs";
import {
  cacheConstant,
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../intrinsic.mjs";
import { zipMeta } from "../mangle.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  bindSequence,
  flatSequence,
  listenSequence,
  mapSequence,
  tellSequence,
} from "../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "./error.mjs";

/**
 * @typedef {import("./fake.js").RawFakeFrame} RawFakeFrame
 */

/**
 * @typedef {import("./fake.js").FakeFrame} FakeFrame
 */

/**
 * @template X
 * @typedef {import("../sequence.js").EffectSequence<X>} EffectSequence
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
 * ) => EffectSequence<FakeFrame>}
 */
export const declareFakeFrame = ({ path, meta }, _context, { frame }) =>
  mapSequence(
    flatSequence(
      map(zipMeta(meta, listEntry(frame)), ([meta, [variable, kind]]) =>
        mapSequence(
          cacheWritable(
            meta,
            kind === "var"
              ? makePrimitiveExpression({ undefined: null }, path)
              : makeIntrinsicExpression("aran.deadzone", path),
            path,
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
export const listFakeInitializeEffect = (
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
export const makeFakeDiscardExpression = (
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
export const makeFakeReadExpression = (
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
export const makeFakeTypeofExpression = ({ path }, context, options) =>
  mapMaybe(makeFakeReadExpression({ path }, context, options), (node) =>
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
export const listFakeWriteEffect = (
  { path, meta },
  _context,
  { frame, variable, right },
) => {
  if (hasOwn(frame, variable)) {
    const { kind, proxy } = frame[variable];
    if (kind === "var") {
      return listWriteCacheEffect(proxy, right, path);
    } else if (kind === "let" || kind === "const") {
      return listenSequence(
        bindSequence(cacheConstant(meta, right, path), (right) =>
          tellSequence([
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
          ]),
        ),
      );
    } else {
      throw new AranTypeError("invalid kind", kind);
    }
  } else {
    return null;
  }
};
