import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeWriteParameterEffect,
} from "../node.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { AranTypeError } from "../../util/error.mjs";

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupEffect = ({ param }, { path }) => {
  if (param.arrow === "none" && param.function.type === "function") {
    return [
      makeConditionalEffect(
        makeReadParameterExpression("new.target", path),
        [
          makeWriteParameterEffect(
            "this",
            makeObjectExpression(
              makeGetExpression(
                makeReadParameterExpression("new.target", path),
                makePrimitiveExpression("prototype", path),
                path,
              ),
              [],
              path,
            ),
            path,
          ),
        ],
        [],
        path,
      ),
    ];
  } else if (param.arrow === "none" && param.function.type === "constructor") {
    return [
      makeWriteParameterEffect(
        "this",
        makeObjectExpression(
          makeGetExpression(
            makeReadParameterExpression("new.target", path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          [],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [];
  }
};

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadThisExpression = ({ param }, { path }) => {
  if (param.function.type === "constructor" && param.function.super !== null) {
    return makeConditionalExpression(
      makeReadParameterExpression("this", path),
      makeReadParameterExpression("this", path),
      makeConditionalExpression(
        makeReadParameterExpression("this", path),
        makeReadParameterExpression("this", path),
        makeThrowErrorExpression(
          "ReferenceError",
          "Illegal 'this' read before calling 'super'",
          path,
        ),
        path,
      ),
      path,
    );
  } else if (param.function.type === "none" && param.situ === "global") {
    return makeIntrinsicExpression("globalThis", path);
  } else {
    return makeReadParameterExpression("this", path);
  }
};

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadNewTargetExpression = ({ param }, { path }) =>
  param.function.type === "none" && param.situ === "global"
    ? makeSyntaxErrorExpression("Illegal 'new.target' read", path)
    : makeReadParameterExpression("new.target", path);

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = ({ param }, arguments_, { path }) => {
  if (param.function.type === "constructor" && param.function.super !== null) {
    return makeConditionalExpression(
      makeReadParameterExpression("this", path),
      makeThrowErrorExpression(
        "ReferenceError",
        "Super constructor can only be called once",
        path,
      ),
      makeLongSequenceExpression(
        [
          makeWriteParameterEffect(
            "this",
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.construct", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(param.function.super, path),
                arguments_,
                makeReadParameterExpression("new.target", path),
              ],
              path,
            ),
            path,
          ),
          ...(param.function.field === null
            ? []
            : [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(param.function.field, path),
                    makeReadParameterExpression("this", path),
                    [],
                    path,
                  ),
                  path,
                ),
              ]),
        ],
        makeReadParameterExpression("this", path),
        path,
      ),
      path,
    );
  } else if (param.function.type === "none" && param.situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.call", path),
      makePrimitiveExpression({ undefined: null }, path),
      [arguments_],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' call", path);
  }
};

/**
 * @type {(
 *   result: import("../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeIsProperObjectExpression = (result, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression(
        "typeof",
        makeReadCacheExpression(result, path),
        path,
      ),
      makePrimitiveExpression("object", path),
      path,
    ),
    makeBinaryExpression(
      "!==",
      makeReadCacheExpression(result, path),
      makePrimitiveExpression(null, path),
      path,
    ),
    makeBinaryExpression(
      "===",
      makeUnaryExpression(
        "typeof",
        makeReadCacheExpression(result, path),
        path,
      ),
      makePrimitiveExpression("function", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   argument: aran.Expression<unbuild.Atom> | null,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReturnArgumentExpression = (
  { param },
  result,
  { path, meta },
) => {
  switch (param.arrow) {
    case "eval": {
      return makeSyntaxErrorExpression("Illegal 'return' statement", path);
    }
    case "arrow": {
      return result ?? makePrimitiveExpression({ undefined: null }, path);
    }
    case "none": {
      switch (param.function.type) {
        case "none": {
          return makeSyntaxErrorExpression("Illegal 'return' statement", path);
        }
        case "method": {
          return result ?? makePrimitiveExpression({ undefined: null }, path);
        }
        case "function": {
          if (result === null) {
            return makeConditionalExpression(
              makeReadParameterExpression("new.target", path),
              makeReadParameterExpression("this", path),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            );
          } else {
            return makeInitCacheExpression(
              "constant",
              result,
              { path, meta },
              (result) =>
                makeConditionalExpression(
                  makeReadParameterExpression("new.target", path),
                  makeConditionalExpression(
                    makeIsProperObjectExpression(result, path),
                    makeReadCacheExpression(result, path),
                    makeReadParameterExpression("this", path),
                    path,
                  ),
                  makeReadCacheExpression(result, path),
                  path,
                ),
            );
          }
        }
        case "constructor": {
          if (param.function.super === null) {
            if (result === null) {
              return makeReadParameterExpression("this", path);
            } else {
              return makeInitCacheExpression(
                "constant",
                result,
                { path, meta },
                (result) =>
                  makeConditionalExpression(
                    makeIsProperObjectExpression(result, path),
                    makeReadCacheExpression(result, path),
                    makeReadParameterExpression("this", path),
                    path,
                  ),
              );
            }
          } else {
            if (result === null) {
              return makeConditionalExpression(
                makeReadParameterExpression("this", path),
                makeReadParameterExpression("this", path),
                makeThrowErrorExpression(
                  "ReferenceError",
                  "Illegal 'return' statement before calling 'super'",
                  path,
                ),
                path,
              );
            } else {
              return makeInitCacheExpression(
                "constant",
                result,
                { path, meta },
                (result) =>
                  makeConditionalExpression(
                    makeReadParameterExpression("this", path),
                    makeConditionalExpression(
                      makeIsProperObjectExpression(result, path),
                      makeReadCacheExpression(result, path),
                      makeThrowErrorExpression(
                        "TypeError",
                        "Derived constructors may only return object or undefined",
                        path,
                      ),
                      path,
                    ),
                    makeThrowErrorExpression(
                      "ReferenceError",
                      "Illegal 'return' statement before calling 'super'",
                      path,
                    ),
                    path,
                  ),
              );
            }
          }
        }
        default: {
          throw new AranTypeError(
            "invalid context.param.function",
            param.function,
          );
        }
      }
    }
    default: {
      throw new AranTypeError("invalid context.param.arrow", param.arrow);
    }
  }
};
