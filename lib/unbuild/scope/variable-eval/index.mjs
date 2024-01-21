import { AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { mapSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = ({ path, meta }) =>
  mapSequence(
    cacheConstant(
      meta,
      makeApplyExpression(
        makeIntrinsicExpression("Object.create", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(null, path)],
        path,
      ),
      path,
    ),
    (record) => ({
      type: /** @type {"eval"} */ ("eval"),
      record,
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: import("..").VariableLoadOperation,
 *   alternate: import("../../sequence").ExpressionSequence,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeEvalLoadExpression = (
  { path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "read") {
    return makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      alternate,
      path,
    );
  } else if (operation.type === "typeof") {
    return makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      makeUnaryExpression(
        "typeof",
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
          ],
          path,
        ),
        path,
      ),
      alternate,
      path,
    );
  } else if (operation.type === "discard") {
    return makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      alternate,
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").EvalFrame,
 *   operation: import("..").VariableSaveOperation,
 *   alternate: import("../../sequence").EffectSequence,
 * ) => import("../../sequence").EffectSequence}
 */
export const listEvalSaveEffect = ({ path }, frame, operation, alternate) => {
  console.dir({ path, frame, operation, alternate });
  if (operation.type === "declare") {
    return makeConditionalEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      EMPTY_EFFECT,
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(frame.record, path),
            makePrimitiveExpression(operation.variable, path),
            makePrimitiveExpression({ undefined: null }, path),
          ],
          path,
        ),
        path,
      ),
      path,
    );
  } else if (operation.type === "initialize" || operation.type === "write") {
    return makeConditionalEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame.record, path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      operation.right === null
        ? EMPTY_EFFECT
        : makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(frame.record, path),
                makePrimitiveExpression(operation.variable, path),
                makeReadCacheExpression(operation.right, path),
              ],
              path,
            ),
            path,
          ),
      alternate,
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};
