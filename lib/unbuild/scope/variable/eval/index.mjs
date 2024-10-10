import { EMPTY } from "../../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { mapSequence, zeroSequence } from "../../../../sequence.mjs";
import { listConditionalEffect } from "../../../../node.mjs";

/**
 * @type {import("../../perform").Setup<
 *   {},
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = (hash, meta, _options) =>
  mapSequence(
    cacheConstant(
      meta,
      makeApplyExpression(
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        [makePrimitiveExpression(null, hash)],
        hash,
      ),
      hash,
    ),
    (record) => ({
      type: "eval",
      record,
    }),
  );

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").EvalFrame,
 *   import("../").LateDeclareVariableOperation,
 *   never,
 * >}
 */
export const listEvalLateDeclareEffect = (hash, _meta, frame, operation) =>
  zeroSequence([
    makeConditionalEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.has", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeReadCacheExpression(frame.record, hash),
          makePrimitiveExpression(operation.variable, hash),
        ],
        hash,
      ),
      EMPTY,
      [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeReadCacheExpression(frame.record, hash),
              makePrimitiveExpression(operation.variable, hash),
              makeIntrinsicExpression("undefined", hash),
            ],
            hash,
          ),
          hash,
        ),
      ],
      hash,
    ),
  ]);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
const makePresentReadExpression = (hash, record, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeReadCacheExpression(record, hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
const makePresentTypeofExpression = (hash, record, { variable }) =>
  makeUnaryExpression(
    "typeof",
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(variable, hash),
      ],
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
const makePresentDiscardExpression = (hash, record, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.deleteProperty", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeReadCacheExpression(record, hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../atom").Effect[]}
 */
const listPresentWriteEffect = (hash, record, { variable, right }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(variable, hash),
        right,
      ],
      hash,
    ),
    hash,
  ),
];

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: null | import("../../../atom").Expression,
 *   },
 * ) => import("../../../atom").Effect[]}
 */
const listPresentWriteSloppyFunctionEffect = (
  hash,
  record,
  { variable, right },
) =>
  right === null
    ? []
    : listPresentWriteEffect(hash, record, { variable, right });

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: unknown,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makePresentReadAmbientThisExpression = (hash, _record, _operation) =>
  makeIntrinsicExpression("undefined", hash);

/**
 * @type {<O extends {
 *   variable: import("estree-sentry").VariableName,
 * }, X>(
 *   perform: (
 *     hash: import("../../../../hash").Hash,
 *     record: import("../../../cache").Cache,
 *     operation: O,
 *   ) => X,
 *   conditional: (
 *     test: import("../../../atom").Expression,
 *     consequent: X,
 *     alternate: X,
 *     hash: import("../../../../hash").Hash,
 *   ) => X,
 * ) => import("../../perform").Intercept<import(".").EvalFrame, O, never, X>}
 */
const compile =
  (perform, conditional) => (hash, _meta, frame, operation, alternate) =>
    zeroSequence(
      conditional(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(frame.record, hash),
            makePrimitiveExpression(operation.variable, hash),
          ],
          hash,
        ),
        perform(hash, frame.record, operation),
        alternate,
        hash,
      ),
    );

export const makeEvalReadExpression = compile(
  makePresentReadExpression,
  makeConditionalExpression,
);

export const makeEvalTypeofExpression = compile(
  makePresentTypeofExpression,
  makeConditionalExpression,
);

export const makeEvalDiscardExpression = compile(
  makePresentDiscardExpression,
  makeConditionalExpression,
);

export const makeEvalReadAmbientThisExpression = compile(
  makePresentReadAmbientThisExpression,
  makeConditionalExpression,
);

export const listEvalWriteEffect = compile(
  listPresentWriteEffect,
  listConditionalEffect,
);

export const listEvalWriteSloppyFunctionEffect = compile(
  listPresentWriteSloppyFunctionEffect,
  listConditionalEffect,
);
