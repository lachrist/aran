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
import { unprefixExpression } from "../../prefix.mjs";

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
    unprefixExpression(
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
      path,
    ),
    makePrimitiveExpression(false, path),
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   record: import("../../cache").Cache,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
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
        operation.right,
      ],
      path,
    );
  } else if (operation.type === "initialize") {
    if (operation.right === null) {
      return makePrimitiveExpression(true, path);
    } else {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("../operation").VariableLoadOperation,
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
    makeBelongExpression({ meta, path }, frame.record, {
      variable: operation.variable,
    }),
    makeLookupExpression({ path }, frame.record, operation),
    alternate,
    path,
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").WithFrame,
 *   operation: import("../operation").VariableSaveOperation,
 *   alternate: import("../../sequence").EffectSequence,
 * ) => import("../../sequence").EffectSequence}
 */
export const listWithSaveEffect = (
  { meta, path },
  frame,
  operation,
  alternate,
) => {
  if (operation.type === "write" || operation.type === "initialize") {
    if (operation.mode === "sloppy") {
      return makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, {
          variable: operation.variable,
        }),
        operation.right === null
          ? EMPTY_EFFECT
          : makeExpressionEffect(
              makeLookupExpression({ path }, frame.record, operation),
              path,
            ),
        alternate,
        path,
      );
    } else if (operation.mode === "strict") {
      return makeConditionalEffect(
        makeBelongExpression({ meta, path }, frame.record, {
          variable: operation.variable,
        }),
        operation.right === null
          ? EMPTY_EFFECT
          : makeConditionalEffect(
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
  } else if (operation.type === "declare") {
    return alternate;
  } else {
    throw new AranTypeError(operation);
  }
};
