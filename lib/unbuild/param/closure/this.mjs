import { AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
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
  makeSequenceExpression,
  makeWriteParameterEffect,
} from "../../node.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
} from "../../sequence.mjs";
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
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSetupThisConstructorEffect = ({ path, meta }, context) => [
  makeWriteParameterEffect(
    "this",
    makeObjectExpression(
      sequenceExpression(
        mapSequence(
          cacheConstant(
            meta,
            makeGetExpression(
              makeReadNewTargetExpression({ path }, context),
              makePrimitiveExpression("prototype", path),
              path,
            ),
            path,
          ),
          (prototype) =>
            makeConditionalExpression(
              makeIsProperObjectExpression({ path }, { value: prototype }),
              makeReadCacheExpression(prototype, path),
              makeIntrinsicExpression("Object.prototype", path),
              path,
            ),
        ),
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
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       kind: "module" | "eval" | "script",
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupThisEffect = ({ path, meta }, context) => {
  switch (context.closure.arrow) {
    case "none": {
      switch (context.closure.type) {
        case "function": {
          return [
            makeConditionalEffect(
              makeReadNewTargetExpression({ path }, context),
              listSetupThisConstructorEffect({ path, meta }, context),
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
              ...listSetupThisConstructorEffect({ path, meta }, context),
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
          switch (context.root.situ) {
            case "local": {
              return [];
            }
            case "global": {
              switch (context.root.kind) {
                case "script": {
                  return [
                    makeWriteParameterEffect(
                      "this",
                      makeIntrinsicExpression("globalThis", path),
                      path,
                    ),
                  ];
                }
                case "eval": {
                  return [
                    makeWriteParameterEffect(
                      "this",
                      makeIntrinsicExpression("globalThis", path),
                      path,
                    ),
                  ];
                }
                case "module": {
                  return [
                    makeWriteParameterEffect(
                      "this",
                      makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                  ];
                }
                default: {
                  throw new AranTypeError(
                    "invalid context.root.kind",
                    context.root.kind,
                  );
                }
              }
            }
            default: {
              throw new AranTypeError(
                "invalid context.root.situ",
                context.root.situ,
              );
            }
          }
        }
        default: {
          throw new AranTypeError("invalid context.closure", context.closure);
        }
      }
    }
    case "arrow": {
      return [];
    }
    case "eval": {
      return [];
    }
    default: {
      throw new AranTypeError(
        "invalid context.closure.arrow",
        context.closure.arrow,
      );
    }
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
      makeThrowErrorExpression(
        "ReferenceError",
        "Cannot read 'this' before initialization",
        path,
      ),
      path,
    );
  } else {
    return makeReadParameterExpression("this", path);
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
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReadThisEffect = ({ path }, context) => {
  if (context.closure.type === "constructor" && context.closure.derived) {
    return [
      makeConditionalEffect(
        makeReadParameterExpression("this", path),
        [],
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "ReferenceError",
              "Cannot read 'this' before initialization",
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ];
  } else {
    return [];
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
  listenSequence(
    bindSequence(cacheConstant(meta, right, path), (right) =>
      tellSequence([
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
      ]),
    ),
  );

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
  makeSequenceExpression(
    listInitializeThisEffect({ path, meta }, context, options),
    makeReadParameterExpression("this", path),
    path,
  );
