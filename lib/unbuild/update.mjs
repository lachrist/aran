import { makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice },
  },
} = globalThis;

/**
 * @typedef {import("./cache.mjs").Cache} Cache
 */

const UPDATE_OPERATOR = {
  "++": /** @type {"+"} */ ("+"),
  "--": /** @type {"+"} */ ("-"),
};

/**
 * @type {(
 *   operator: estree.UpdateOperator,
 * ) => estree.BinaryOperator}
 */
export const toUpdateBinaryOperator = (operator) => UPDATE_OPERATOR[operator];

/**
 * @type {(
 *   operator: estree.AssignmentOperator,
 * ) => estree.BinaryOperator}
 */
export const toAssignmentBinaryOperator = (operator) =>
  /** @type {estree.BinaryOperator} */ (apply(slice, operator, [0, -1]));

/**
 * @type {(
 *   target: Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeConvertNumberExpression = (target, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression(
        "typeof",
        makeReadCacheExpression(target, path),
        path,
      ),
      makePrimitiveExpression("bigint", path),
      path,
    ),
    makeReadCacheExpression(target, path),
    makeApplyExpression(
      makeIntrinsicExpression("Number", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(target, path)],
      path,
    ),
    path,
  );

/**
 * @type {(
 *   base: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeOneExpression = (base, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", base, path),
      makePrimitiveExpression("bigint", path),
      path,
    ),
    makePrimitiveExpression({ bigint: "1" }, path),
    makePrimitiveExpression(1, path),
    path,
  );
