import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
import {
  makeReadCacheExpression,
  makeInitCacheExpression,
} from "../../cache.mjs";
import {
  makeThrowErrorExpression,
  makeLongSequenceExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import { splitMeta } from "../../mangle.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeExpressionEffect,
  makeConditionalExpression,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @type {(
 *   closure: Closure & { type: "method" | "constructor" },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = (closure, path) => {
  if (closure.type === "method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(closure.proto, path)],
      path,
    );
  } else if (closure.type === "constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeGetExpression(
          makeReadCacheExpression(closure.self, path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
      ],
      path,
    );
  } else {
    throw new AranTypeError("invalid superable closure", closure);
  }
};

///////////////
// super.get //
///////////////

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = (
  { root: { situ }, closure },
  key,
  { path },
) => {
  if (closure.type === "method" || closure.type === "constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeSuperExpression(closure, path),
        key,
        makeReadParameterExpression("this", path),
      ],
      path,
    );
  } else if (closure.type === "none" && situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [key],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' get", path);
  }
};

///////////////
// super.set //
///////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     meta: unbuild.Meta,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetSuperEffect = (
  { mode, root: { situ }, closure },
  key,
  value,
  { meta, path },
) => {
  if (closure.type === "method" || closure.type === "constructor") {
    return [
      makeExpressionEffect(
        guard(
          mode === "sloppy",
          (node) =>
            makeConditionalExpression(
              node,
              makePrimitiveExpression({ undefined: null }, path),
              makeThrowErrorExpression(
                "TypeError",
                "Cannot set 'super' property",
                path,
              ),
              path,
            ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeSuperExpression(closure, path),
              key,
              value,
              makeReadParameterExpression("this", path),
            ],
            path,
          ),
        ),
        path,
      ),
    ];
  } else {
    return [
      makeExpressionEffect(
        // eslint-disable-next-line no-use-before-define
        makeSetSuperExpression({ mode, root: { situ }, closure }, key, value, {
          path,
          meta,
        }),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (
  { mode, root: { situ }, closure },
  key,
  value,
  { path, meta },
) => {
  if (closure.type === "method" || closure.type === "constructor") {
    const metas = splitMeta(meta, ["cache", "super"]);
    return makeInitCacheExpression(
      "constant",
      value,
      { path, meta: metas.cache },
      (value) =>
        makeLongSequenceExpression(
          listSetSuperEffect(
            { mode, root: { situ }, closure },
            key,
            makeReadCacheExpression(value, path),
            {
              path,
              meta: metas.super,
            },
          ),
          makeReadCacheExpression(value, path),
          path,
        ),
    );
  } else if (closure.type === "none" && situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [key, value],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' set", path);
  }
};
