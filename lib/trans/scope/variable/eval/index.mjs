import {
  constant1,
  EMPTY,
  flatenTree,
  hasOwn,
  map,
  mapSequence,
  recordArray,
  return$,
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

const returnNull = constant1(null);

/**
 * @type {import("../../api.d.ts").Setup<
 *   import("./index.d.ts").RawEvalFrame,
 *   (
 *     | import("../../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").EvalFrame,
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
      permanent: recordArray(variables, return$, returnNull),
    }),
  );

/**
 * @type {import("../../api.d.ts").PerformEffect<
 *   import("./index.d.ts").EvalFrame,
 *   import("../index.d.ts").LateDeclareVariableOperation,
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
const makePermanentDiscardExpression = (hash, _record, _operation) =>
  makePrimitiveExpression(false, hash);

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: import("../../../cache.d.ts").Cache,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom.d.ts").Expression,
 *   },
 * ) => import("../../../../util/tree.d.ts").Tree<import("../../../atom.d.ts").Effect>}
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
 *   hash: import("../../../hash.d.ts").Hash,
 *   record: unknown,
 *   operation: unknown,
 * ) => import("../../../atom.d.ts").Expression}
 */
const makeReadAmbientThisExpression = (hash, _record, _operation) =>
  makeIntrinsicExpression("undefined", hash);

/**
 * @type {<O extends {
 *   variable: import("estree-sentry").VariableName,
 * }, X>(
 *   performPermanent: (
 *     hash: import("../../../hash.d.ts").Hash,
 *     record: import("../../../cache.d.ts").Cache,
 *     operation: O,
 *   ) => X,
 *   performTransient: (
 *      hash: import("../../../hash.d.ts").Hash,
 *     record: import("../../../cache.d.ts").Cache,
 *     operation: O,
 *   ) => X,
 *   conditional: (
 *     test: import("../../../atom.d.ts").Expression,
 *     consequent: X,
 *     alternate: X,
 *     hash: import("../../../hash.d.ts").Hash,
 *   ) => X,
 * ) => import("../../api.d.ts").Intercept<import("./index.d.ts").EvalFrame, O, never, X>}
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
