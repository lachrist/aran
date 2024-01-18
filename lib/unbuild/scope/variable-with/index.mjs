import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
  EMPTY_EFFECT,
} from "../../node.mjs";

import { makeGetExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { bindSequence } from "../../sequence.mjs";
import { AranTypeError } from "../../../error.mjs";
import { makeThrowConstantExpression } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   record: import("../../cache").Cache,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeBelongExpression = ({ path, meta }, record, { variable }) =>
  makeConditionalExpression(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.has", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
    bindSequence(
      cacheConstant(
        meta,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(record, path),
            makeIntrinsicExpression("Symbol.unscopables", path),
          ],
          path,
        ),
        path,
      ),
      (unscopables) =>
        makeConditionalExpression(
          makeReadCacheExpression(unscopables, path),
          makeUnaryExpression(
            "!",
            makeGetExpression(
              makeReadCacheExpression(unscopables, path),
              makePrimitiveExpression(variable, path),
              path,
            ),
            path,
          ),
          makePrimitiveExpression(true, path),
          path,
        ),
    ),
    makePrimitiveExpression(false, path),
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeLookupExpression = ({ path }, record, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      path,
    );
  } else if (operation.type === "discard") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.deleteProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "write") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        makeReadCacheExpression(operation.right, path),
      ],
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("..").VariableLoadOperation,
 *   alternate: import("../../sequence").ExpressionSequence,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeWithLoadExpression = (
  { path, meta },
  frame,
  operation,
  alternate,
) =>
  makeConditionalExpression(
    makeBelongExpression({ meta, path }, frame.record, operation),
    makeLookupExpression({ path }, frame.record, operation),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("..").VariableSaveOperation,
 *   alternate: import("../../sequence").EffectSequence,
 * ) => import("../../sequence").EffectSequence}
 */
export const listWithSaveEffect = (
  { meta, path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "write") {
    if (operation.mode === "sloppy") {
      return makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, operation),
        makeExpressionEffect(
          makeLookupExpression({ path }, frame.record, operation),
          path,
        ),
        alternate,
        path,
      );
    } else if (operation.mode === "strict") {
      return makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, operation),
        makeConditionalEffect(
          makeLookupExpression({ path }, frame.record, operation),
          EMPTY_EFFECT,
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          ),
          path,
        ),
        alternate,
        path,
      );
    } else {
      throw new AranTypeError(operation.mode);
    }
  } else if (operation.type === "initialize" || operation.type === "declare") {
    return alternate;
  } else {
    throw new AranTypeError(operation);
  }
};
