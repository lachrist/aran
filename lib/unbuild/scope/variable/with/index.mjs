import {
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
} from "../../../node.mjs";

import { makeGetExpression, makeUnaryExpression } from "../../../intrinsic.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  liftSequenceX,
  liftSequenceX___,
  mapSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
import { AranTypeError } from "../../../../report.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import { incorporateExpression } from "../../../prelude/index.mjs";
import { concat_, EMPTY } from "../../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";

/**
 * @type {import("../../api").Setup<
 *   import(".").RawWithFrame,
 *   never,
 *   import(".").WithFrame,
 * >}
 */
export const setupWithFrame = (_hash, _meta, { record }) =>
  zeroSequence({
    type: "with",
    record,
  });

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   record: import("../../../cache").Cache,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../../sequence").Sequence<
 *   import("../../../prelude").MetaDeclarationPrelude,
 *   import("../../../atom").Expression,
 * >}
 */
const makeBelongExpression = (hash, meta, record, variable) =>
  mapSequence(
    incorporateExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeReadCacheExpression(record, hash),
              makeIntrinsicExpression("Symbol.unscopables", hash),
            ],
            hash,
          ),
          hash,
        ),
        (unscopables) =>
          makeConditionalExpression(
            makeReadCacheExpression(unscopables, hash),
            makeUnaryExpression(
              "!",
              makeGetExpression(
                makeReadCacheExpression(unscopables, hash),
                makePrimitiveExpression(variable, hash),
                hash,
              ),
              hash,
            ),
            makePrimitiveExpression(true, hash),
            hash,
          ),
      ),
      hash,
    ),
    (consequent) =>
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(record, hash),
            makePrimitiveExpression(variable, hash),
          ],
          hash,
        ),
        consequent,
        makePrimitiveExpression(false, hash),
        hash,
      ),
  );

/**
 * @type {<O extends { variable: import("estree-sentry").VariableName }>(
 *   perform: (
 *     hash: import("../../../../hash").Hash,
 *     record: import("../../../cache").Cache,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 * ) => import("../../api").InterceptExpression<
 *   import(".").WithFrame,
 *   O,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
const compileExpressionOperation =
  (perform) =>
  (hash, meta, { record }, operation, alternate) =>
    liftSequenceX___(
      makeConditionalExpression,
      makeBelongExpression(
        hash,
        forkMeta((meta = nextMeta(meta))),
        record,
        operation.variable,
      ),
      perform(hash, record, operation),
      alternate,
      hash,
    );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: import("..").VariableOperation,
 * ) => import("../../../atom").Expression}
 */
const makeReadExpression = (hash, record, operation) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeReadCacheExpression(record, hash),
      makePrimitiveExpression(operation.variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: import("..").VariableOperation,
 * ) => import("../../../atom").Expression}
 */
const makeTypeofExpression = (hash, record, operation) =>
  makeUnaryExpression(
    "typeof",
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeReadCacheExpression(record, hash),
        makePrimitiveExpression(operation.variable, hash),
      ],
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: import("..").VariableOperation,
 * ) => import("../../../atom").Expression}
 */
const makeDiscardExpression = (hash, record, operation) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.deleteProperty", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeReadCacheExpression(record, hash),
      makePrimitiveExpression(operation.variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: import("..").WriteVariableOperation,
 * ) => import("../../../atom").Expression}
 */
const makeWriteExpression = (hash, record, operation) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.set", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeReadCacheExpression(record, hash),
      makePrimitiveExpression(operation.variable, hash),
      operation.right,
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: import("..").VariableOperation,
 * ) => import("../../../atom").Expression}
 */
const makeReadAmbientThisExpression = (hash, record, _operation) =>
  makeReadCacheExpression(record, hash);

export const makeWithReadExpression =
  compileExpressionOperation(makeReadExpression);

export const makeWithTypeofExpression =
  compileExpressionOperation(makeTypeofExpression);

export const makeWithDiscardExpression = compileExpressionOperation(
  makeDiscardExpression,
);

export const makeWithWriteExpression =
  compileExpressionOperation(makeWriteExpression);

export const makeWithReadAmbientThisExpression = compileExpressionOperation(
  makeReadAmbientThisExpression,
);

/**
 * @type {import("../../api").InterceptEffect<
 *   import(".").WithFrame,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listWithWriteEffect = (
  hash,
  meta,
  { record },
  operation,
  alternate,
) => {
  switch (operation.mode) {
    case "sloppy": {
      return liftSequenceX(
        concat_,
        liftSequenceX___(
          makeConditionalEffect,
          makeBelongExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            record,
            operation.variable,
          ),
          operation.right === null
            ? EMPTY
            : [
                makeExpressionEffect(
                  makeWriteExpression(hash, record, operation),
                  hash,
                ),
              ],
          alternate,
          hash,
        ),
      );
    }
    case "strict": {
      return liftSequenceX(
        concat_,
        liftSequenceX___(
          makeConditionalEffect,
          makeBelongExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            record,
            operation.variable,
          ),
          operation.right === null
            ? EMPTY
            : [
                makeConditionalEffect(
                  makeWriteExpression(hash, record, operation),
                  EMPTY,
                  [
                    makeExpressionEffect(
                      makeThrowConstantExpression(operation.variable, hash),
                      hash,
                    ),
                  ],
                  hash,
                ),
              ],
          alternate,
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(operation.mode);
    }
  }
};

/**
 * @type {import("../../api").InterceptEffect<
 *   import(".").WithFrame,
 *   import("..").LateDeclareVariableOperation,
 *   never,
 * >}
 */
export const listWithLateDeclareEffect = (
  _hash,
  _meta,
  _frame,
  _operation,
  alternate,
) => zeroSequence(alternate);
