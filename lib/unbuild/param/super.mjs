import { guard } from "../../util/closure.mjs";
import { AranTypeError } from "../../util/index.mjs";
import { makeReadCacheExpression, makeInitCacheExpression } from "../cache.mjs";
import {
  makeThrowErrorExpression,
  makeLongSequenceExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeExpressionEffect,
  makeConditionalExpression,
} from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   param: Param,
 * ) => param is Param & { function: { type: "method" | "constructor" } }}
 */
const isSuperableParam = (param) =>
  param.function.type === "method" || param.function.type === "constructor";

/**
 * @type {(
 *   param: Param & { function: { type: "method" | "constructor" } },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = (param, path) => {
  if (param.function.type === "method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(param.function.proto, path)],
      path,
    );
  } else if (param.function.type === "constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeGetExpression(
          makeReadCacheExpression(param.function.self, path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
      ],
      path,
    );
  } else {
    throw new AranTypeError("invalid param.type", param.function);
  }
};

///////////////
// super.get //
///////////////

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = ({ param }, key, { path }) => {
  if (isSuperableParam(param)) {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeSuperExpression(param, path),
        key,
        makeReadParameterExpression("this", path),
      ],
      path,
    );
  } else if (param.function.type === "none" && param.situ === "local") {
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
 *   mode: "strict" | "sloppy",
 *   object: aran.Expression<unbuild.Atom>,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listInternalSetSuperEffect = (mode, object, key, value, path) => [
  makeExpressionEffect(
    guard(
      mode === "sloppy",
      (node) =>
        makeConditionalExpression(
          node,
          makeThrowErrorExpression(
            "TypeError",
            "Cannot assign object property",
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, key, value, makeReadParameterExpression("this", path)],
        path,
      ),
    ),
    path,
  ),
];

/**
 * @type {(
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeExternalSetSuperExpression = (key, value, path) =>
  makeApplyExpression(
    makeReadParameterExpression("super.set", path),
    makePrimitiveExpression({ undefined: null }, path),
    [key, value],
    path,
  );

/**
 * @type {(
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeIllegalSetSuperExpression = (path) =>
  makeSyntaxErrorExpression("Illegal 'super' set", path);

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     param: Param,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetSuperEffect = ({ mode, param }, key, value, { path }) => {
  if (isSuperableParam(param)) {
    return listInternalSetSuperEffect(
      mode,
      makeSuperExpression(param, path),
      key,
      value,
      path,
    );
  } else if (param.function.type === "none" && param.situ === "local") {
    return [
      makeExpressionEffect(
        makeExternalSetSuperExpression(key, value, path),
        path,
      ),
    ];
  } else {
    return [makeExpressionEffect(makeIllegalSetSuperExpression(path), path)];
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     param: Param,
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
  { mode, param },
  key,
  value,
  { path, meta },
) => {
  if (isSuperableParam(param)) {
    return makeInitCacheExpression("constant", value, { path, meta }, (value) =>
      makeLongSequenceExpression(
        listInternalSetSuperEffect(
          mode,
          makeSuperExpression(param, path),
          key,
          makeReadCacheExpression(value, path),
          path,
        ),
        makeReadCacheExpression(value, path),
        path,
      ),
    );
  } else if (param.function.type === "none" && param.situ === "local") {
    return makeExternalSetSuperExpression(key, value, path);
  } else {
    return makeIllegalSetSuperExpression(path);
  }
};
