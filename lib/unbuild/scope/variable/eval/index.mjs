import {
  EMPTY,
  flatenTree,
  hasOwn,
  map,
  mapSequence,
  reduceEntry,
  zeroSequence,
} from "../../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeTreeConditionalEffect,
} from "../../../node.mjs";

/**
 * @type {<X>(
 *   first: X,
 * ) => [X, null]}
 */
const toNullEntry = (variable) => [variable, null];

/**
 * @type {import("../../api").Setup<
 *   import(".").RawEvalFrame,
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").EvalFrame,
 * >}
 */
export const setupEvalFrame = (hash, meta, { variables }) =>
  mapSequence(
    cacheConstant(
      meta,
      makeApplyExpression(
        makeIntrinsicExpression("aran.createObject", hash),
        makeIntrinsicExpression("undefined", hash),
        flatenTree([
          makePrimitiveExpression(null, hash),
          map(variables, (variable) => [
            makePrimitiveExpression(variable, hash),
            makeIntrinsicExpression("undefined", hash),
          ]),
        ]),
        hash,
      ),
      hash,
    ),
    (record) => ({
      type: "eval",
      record,
      permanent: reduceEntry(map(variables, toNullEntry)),
    }),
  );

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").EvalFrame,
 *   import("../").LateDeclareVariableOperation,
 *   never,
 * >}
 */
export const listEvalLateDeclareEffect = (hash, _meta, frame, operation) =>
  zeroSequence(
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
const makeReadExpression = (hash, record, { variable }) =>
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
const makeTypeofExpression = (hash, record, { variable }) =>
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
const makeTransientDiscardExpression = (hash, record, { variable }) =>
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
 *   },
 * ) => import("../../../atom").Expression}
 */
const makePermanentDiscardExpression = (hash, _record, _operation) =>
  makePrimitiveExpression(false, hash);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: import("../../../cache").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../../util/tree").Tree<import("../../../atom").Effect>}
 */
const listWriteEffect = (hash, record, { variable, right }) =>
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
  );

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   record: unknown,
 *   operation: unknown,
 * ) => import("../../../atom").Expression}
 */
const makeReadAmbientThisExpression = (hash, _record, _operation) =>
  makeIntrinsicExpression("undefined", hash);

/**
 * @type {<O extends {
 *   variable: import("estree-sentry").VariableName,
 * }, X>(
 *   performPermanent: (
 *     hash: import("../../../../hash").Hash,
 *     record: import("../../../cache").Cache,
 *     operation: O,
 *   ) => X,
 *   performTransient: (
 *      hash: import("../../../../hash").Hash,
 *     record: import("../../../cache").Cache,
 *     operation: O,
 *   ) => X,
 *   conditional: (
 *     test: import("../../../atom").Expression,
 *     consequent: X,
 *     alternate: X,
 *     hash: import("../../../../hash").Hash,
 *   ) => X,
 * ) => import("../../api").Intercept<import(".").EvalFrame, O, never, X>}
 */
const compile =
  (performPermanent, performTransient, conditional) =>
  (hash, _meta, frame, operation, alternate) =>
    zeroSequence(
      hasOwn(frame.permanent, operation.variable)
        ? performPermanent(hash, frame.record, operation)
        : conditional(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(frame.record, hash),
                makePrimitiveExpression(operation.variable, hash),
              ],
              hash,
            ),
            performTransient(hash, frame.record, operation),
            alternate,
            hash,
          ),
    );

export const makeEvalReadExpression = compile(
  makeReadExpression,
  makeReadExpression,
  makeConditionalExpression,
);

export const makeEvalTypeofExpression = compile(
  makeTypeofExpression,
  makeTypeofExpression,
  makeConditionalExpression,
);

export const makeEvalDiscardExpression = compile(
  makePermanentDiscardExpression,
  makeTransientDiscardExpression,
  makeConditionalExpression,
);

export const makeEvalReadAmbientThisExpression = compile(
  makeReadAmbientThisExpression,
  makeReadAmbientThisExpression,
  makeConditionalExpression,
);

export const listEvalWriteEffect = compile(
  listWriteEffect,
  listWriteEffect,
  makeTreeConditionalEffect,
);

// If the binding has been deleted, the write will be passed up the scope chain.
//
// (() => {
//   eval(`
//       console.log('delete', delete g);
//       { function g () {}; }
//     `);
// })();
// console.log("global g", g);
//
// delete true
// global g [Function: g]
export const listEvalWriteSloppyFunctionEffect = listEvalWriteEffect;
