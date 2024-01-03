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
 *   target: import("./cache").Cache,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
 *   base: import("./sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
