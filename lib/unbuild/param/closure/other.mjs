import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeWriteParameterEffect,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../report.mjs";
import {
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { AranTypeError } from "../../../util/error.mjs";

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @type {(
 *   context: {
 *     closure: Closure,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupEffect = ({ closure }, { path }) => {
  if (closure.arrow === "none" && closure.type === "function") {
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
  } else if (closure.arrow === "none" && closure.type === "constructor") {
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
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadThisExpression = (
  { root: { situ }, closure },
  { path },
) => {
  if (closure.type === "constructor" && closure.super !== null) {
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
  } else if (closure.type === "none" && situ === "global") {
    return makeIntrinsicExpression("globalThis", path);
  } else {
    return makeReadParameterExpression("this", path);
  }
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadNewTargetExpression = (
  { root: { situ }, closure },
  { path },
) =>
  closure.type === "none" && situ === "global"
    ? makeSyntaxErrorExpression("Illegal 'new.target' read", path)
    : makeReadParameterExpression("new.target", path);

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = (
  { root: { situ }, closure },
  arguments_,
  { path },
) => {
  if (closure.type === "constructor" && closure.super !== null) {
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
                makeReadCacheExpression(closure.super, path),
                arguments_,
                makeReadParameterExpression("new.target", path),
              ],
              path,
            ),
            path,
          ),
          ...(closure.field === null
            ? []
            : [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(closure.field, path),
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
  } else if (closure.type === "none" && situ === "local") {
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
 *   result: Cache,
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
 *     closure: Closure,
 *   },
 *   argument: aran.Expression<unbuild.Atom> | null,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReturnArgumentExpression = (
  { closure },
  result,
  { path, meta },
) => {
  switch (closure.arrow) {
    case "eval": {
      return makeSyntaxErrorExpression("Illegal 'return' statement", path);
    }
    case "arrow": {
      return result ?? makePrimitiveExpression({ undefined: null }, path);
    }
    case "none": {
      switch (closure.type) {
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
          if (closure.super === null) {
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
          throw new AranTypeError("invalid context.closure", closure);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid context.closure.arrow", closure.arrow);
    }
  }
};
