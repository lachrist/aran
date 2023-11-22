import { AranTypeError } from "../../../error.mjs";
import { listInitCacheEffect, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
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
import { makeReadNewTargetExpression } from "./new-target.mjs";

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSetupThisConstructorEffect = ({ path }, context) => [
  makeWriteParameterEffect(
    "this",
    makeObjectExpression(
      makeGetExpression(
        makeReadNewTargetExpression({ path }, context),
        makePrimitiveExpression("prototype", path),
        path,
      ),
      [],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const lisSetupThisMethodEffect = ({ path }, context) => {
  switch (context.mode) {
    case "strict": {
      return [];
    }
    case "sloppy": {
      return [
        makeWriteParameterEffect(
          "this",
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeReadParameterExpression("this", path),
              makePrimitiveExpression(null, path),
              path,
            ),
            makeIntrinsicExpression("globalThis", path),
            makeApplyExpression(
              makeIntrinsicExpression("Object", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadParameterExpression("this", path)],
              path,
            ),
            path,
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid context.mode", context.mode);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupThisEffect = ({ path }, context) => {
  if (context.closure.arrow === "none") {
    switch (context.closure.type) {
      case "function": {
        return [
          makeConditionalEffect(
            makeReadNewTargetExpression({ path }, context),
            listSetupThisConstructorEffect({ path }, context),
            lisSetupThisMethodEffect({ path }, context),
            path,
          ),
        ];
      }
      case "constructor": {
        if (context.closure.derived) {
          return [];
        } else {
          return [
            ...listSetupThisConstructorEffect({ path }, context),
            makeConditionalEffect(
              makeReadCacheExpression(context.closure.field, path),
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(context.closure.field, path),
                    makeReadParameterExpression("this", path),
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
        }
      }
      case "method": {
        return lisSetupThisMethodEffect({ path }, context);
      }
      case "none": {
        return [];
      }
      default: {
        throw new AranTypeError("invalid context.closure", context.closure);
      }
    }
  } else {
    return [];
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadThisExpression = ({ path }, context) => {
  if (context.closure.type === "constructor" && context.closure.derived) {
    return makeConditionalExpression(
      makeReadParameterExpression("this", path),
      makeReadParameterExpression("this", path),
      makeConditionalExpression(
        makeReadParameterExpression("this", path),
        makeReadParameterExpression("this", path),
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot read 'this' before initialization",
          path,
        ),
        path,
      ),
      path,
    );
  } else if (
    context.closure.type === "none" &&
    context.root.situ === "global"
  ) {
    return makeIntrinsicExpression("globalThis", path);
  } else {
    return makeReadParameterExpression("this", path);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     closure: Closure & {
 *       type: "constructor",
 *       derived: true,
 *     },
 *   },
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializeThisEffect = ({ path, meta }, context, { right }) =>
  // super() gets called even if this is already defined
  // The check is performed after the call.
  listInitCacheEffect("constant", right, { path, meta }, (right) => [
    makeConditionalEffect(
      makeReadParameterExpression("this", path),
      [
        makeExpressionEffect(
          makeThrowErrorExpression(
            "ReferenceError",
            "Duplicate 'this' initialization",
            path,
          ),
          path,
        ),
      ],
      [
        makeWriteParameterEffect(
          "this",
          makeReadCacheExpression(right, path),
          path,
        ),
        makeConditionalEffect(
          makeReadCacheExpression(context.closure.field, path),
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeReadCacheExpression(context.closure.field, path),
                makeReadParameterExpression("this", path),
                [],
                path,
              ),
              path,
            ),
          ],
          [],
          path,
        ),
      ],
      path,
    ),
  ]);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     closure: Closure & {
 *       type: "constructor",
 *       derived: true,
 *     },
 *   },
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeInitializeThisExpression = (
  { path, meta },
  context,
  options,
) =>
  makeLongSequenceExpression(
    listInitializeThisEffect({ path, meta }, context, options),
    makeReadParameterExpression("this", path),
    path,
  );
