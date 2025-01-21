import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  listExpressionEffect,
  makeConditionalExpression,
  makeExpressionEffect,
} from "../../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  everyNarrow,
  includes,
  liftSequenceX_,
  liftSequence_X__,
  thenSequence,
  zeroSequence,
} from "../../../../util/index.mjs";
import { incorporateEffect } from "../../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";
import {
  declareGlobal,
  makeGlobalBelongExpression,
  makeGlobalDiscardExpression,
  makeGlobalReadExpression,
  makeGlobalTypeofExpression,
  makeGlobalWriteExpression,
} from "./reify-global.mjs";
import {
  declareRecord,
  makeRecordBelongExpression,
  makeRecordDiscardExpression,
  makeRecordReadExpression,
  makeRecordTypeofExpression,
  makeRecordWriteExpression,
} from "./reify-record.mjs";
import {
  makeMissingDiscardExpression,
  makeMissingReadExpression,
  makeMissingTypeofExpression,
  makeMissingWriteExpression,
} from "./reify-missing.mjs";

export { listReifyInitializeEffect } from "./reify-record.mjs";

/**
 * @type {(
 *   kind: import("./index").RootKind,
 * ) => kind is import(".").GlobalRootKind}
 */
const isGlobalKind = (kind) =>
  kind === "var" ||
  kind === "function-strict" ||
  kind === "function-sloppy-near" ||
  kind === "function-sloppy-away";

/**
 * @type {import("../../api").Setup<
 *   {
 *     binding: [
 *       import("estree-sentry").VariableName,
 *       import(".").RootKind[],
 *     ],
 *     sort: import("../../../sort").Sort,
 *   },
 *   (
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   null | import(".").ReifyBinding,
 * >}
 */
export const setupReifyBinding = (
  hash,
  _meta,
  { binding: { 0: variable, 1: kinds }, sort },
) => {
  if (everyNarrow(kinds, isGlobalKind)) {
    return declareGlobal(hash, variable, {
      eval:
        sort === "eval.global" ||
        sort === "eval.local.deep" ||
        sort === "eval.local.root",
      kinds,
    });
  } else {
    return thenSequence(
      declareRecord(hash, variable, { kinds }),
      zeroSequence({
        variable,
        status: "dead",
        write: includes(kinds, "const") ? "report" : "perform",
      }),
    );
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").ReifyMatch,
 *   import("..").LateDeclareVariableOperation,
 *   (
 *     | import("../../../prelude").WarningPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").NativeExternalPrelude
 *   ),
 * >}
 */
export const listReifyLateDeclareEffect = (
  hash,
  _meta,
  _match,
  { variable, kinds },
) =>
  incorporateEffect(
    thenSequence(
      declareGlobal(hash, variable, {
        eval: true,
        kinds,
      }),
      EMPTY_SEQUENCE,
    ),
    hash,
  );

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").ReifyMatch,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listReifyWriteEffect = (
  hash,
  meta,
  match,
  { mode, variable, closure, right },
) => {
  if (match.binding === null) {
    return incorporateEffect(
      bindSequence(
        cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
        (right) =>
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence_X__(
              makeConditionalExpression,
              makeRecordBelongExpression(hash, variable),
              makeRecordWriteExpression(hash, meta, match, {
                variable,
                closure,
                right: makeReadCacheExpression(right, hash),
              }),
              makeConditionalExpression(
                makeGlobalBelongExpression(hash, variable),
                makeGlobalWriteExpression(hash, {
                  mode,
                  variable,
                  right: makeReadCacheExpression(right, hash),
                }),
                makeMissingWriteExpression(hash, {
                  mode,
                  variable,
                  right: makeReadCacheExpression(right, hash),
                }),
                hash,
              ),
              hash,
            ),
            hash,
          ),
      ),
      hash,
    );
  } else {
    return liftSequenceX_(
      makeExpressionEffect,
      makeRecordWriteExpression(hash, meta, match, {
        variable,
        closure,
        right,
      }),
      hash,
    );
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").ReifyMatch,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listReifyWriteWriteSloppyFunctionEffect = (
  hash,
  meta,
  match,
  operation,
) => {
  if (match.binding === null) {
    return listReifyWriteEffect(hash, meta, match, operation);
  } else {
    return zeroSequence(listExpressionEffect(operation.right, hash));
  }
};

/**
 * @type {<W, O extends { variable: import("estree-sentry").VariableName }>(
 *   makeRecordLookupExpression: import("../../api").PerformExpression<
 *     import(".").ReifyMatch,
 *     O,
 *     W,
 *   >,
 *   makeGlobalLookupExpression: (
 *     hash: import("../../../hash").Hash,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 *   makeMissingLookupExpression: (
 *     hash: import("../../../hash").Hash,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 * ) => import("../../api").PerformExpression<
 *   import(".").ReifyMatch,
 *   O,
 *   W,
 * >}
 */
const compileOperation =
  (
    makeRecordLookupExpression,
    makeGlobalLookupExpression,
    makeMissingLookupExpression,
  ) =>
  (hash, meta, match, operation) => {
    if (match.binding === null) {
      return liftSequence_X__(
        makeConditionalExpression,
        makeRecordBelongExpression(hash, operation.variable),
        makeRecordLookupExpression(hash, meta, match, operation),
        makeConditionalExpression(
          makeGlobalBelongExpression(hash, operation.variable),
          makeGlobalLookupExpression(hash, operation),
          makeMissingLookupExpression(hash, operation),
          hash,
        ),
        hash,
      );
    } else {
      return makeRecordLookupExpression(hash, meta, match, operation);
    }
  };

export const makeReifyReadExpression = compileOperation(
  makeRecordReadExpression,
  makeGlobalReadExpression,
  makeMissingReadExpression,
);

export const makeReifyTypeofExpression = compileOperation(
  makeRecordTypeofExpression,
  makeGlobalTypeofExpression,
  makeMissingTypeofExpression,
);

export const makeReifyDiscardExpression = compileOperation(
  makeRecordDiscardExpression,
  makeGlobalDiscardExpression,
  makeMissingDiscardExpression,
);
