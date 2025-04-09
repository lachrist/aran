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
import { AranTypeError } from "../../../../error.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import { incorporateExpression } from "../../../prelude/index.mjs";
import {
  concat_,
  EMPTY,
  flatenTree,
  liftSequenceX,
  liftSequenceX___,
  mapSequence,
  zeroSequence,
} from "../../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";

/**
 * @type {import("../../api.d.ts").Setup<
 *   import("./index.d.ts").RawWithFrame,
 *   never,
 *   import("./index.d.ts").WithFrame,
 * >}
 */
export const setupWithFrame = (_hash, _meta, { record }) =>
  zeroSequence({
    type: "with",
    record,
  });

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   meta: import("../../../meta.d.ts").Meta,
 *   record: import("../../../cache.d.ts").Cache,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../../util/sequence.d.ts").Sequence<
 *   import("../../../prelude/index.d.ts").MetaDeclarationPrelude,
 *   import("../../../atom.d.ts").Expression,
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
 *     hash: import("../../../hash.d.ts").Hash,
 *     record: import("../../../cache.d.ts").Cache,
 *     operation: O,
 *   ) => import("../../../atom.d.ts").Expression,
 * ) => import("../../api.d.ts").InterceptExpression<
 *   import("./index.d.ts").WithFrame,
 *   O,
 *   import("../../../prelude/index.d.ts").MetaDeclarationPrelude,
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: import("../index.d.ts").VariableOperation,
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: import("../index.d.ts").VariableOperation,
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: import("../index.d.ts").VariableOperation,
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: import("../index.d.ts").WriteVariableOperation,
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: import("../index.d.ts").VariableOperation,
 * ) => import("../../../atom.d.ts").Expression}
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

export const makeWithReadAmbientThisExpression = compileExpressionOperation(
  makeReadAmbientThisExpression,
);

/**
 * @type {import("../../api.d.ts").InterceptEffect<
 *   import("./index.d.ts").WithFrame,
 *   import("../index.d.ts").WriteVariableOperation,
 *   import("../../../prelude/index.d.ts").MetaDeclarationPrelude,
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
      return liftSequenceX___(
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
        flatenTree(alternate),
        hash,
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
          flatenTree(alternate),
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(operation.mode);
    }
  }
};

// Write sloppy function bypass with frame:
//
// (() => {
//   const o = { g: 123 };
//   with (o) {
//     function g() {}
//   }
//   console.log({ o, g });
// })();
//
// { o: { g: 123 }, g: [Function: g] }

/**
 * @type {import("../../api.d.ts").InterceptEffect<
 *   import("./index.d.ts").WithFrame,
 *   import("../index.d.ts").WriteSloppyFunctionVariableOperation,
 *   never,
 * >}
 */
export const listWithWriteSloppyFunctionEffect = (
  _hash,
  _meta,
  _frame,
  _operation,
  alternate,
) => zeroSequence(alternate);

/**
 * @type {import("../../api.d.ts").InterceptEffect<
 *   import("./index.d.ts").WithFrame,
 *   import("../index.d.ts").LateDeclareVariableOperation,
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
