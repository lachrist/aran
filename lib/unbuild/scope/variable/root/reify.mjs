import { AranExecError } from "../../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  listExpressionEffect,
  makeConditionalExpression,
  makeExpressionEffect,
} from "../../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
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
 * @type {import("../../api").Setup<
 *   import("../../../annotation/hoisting").Binding,
 *   (
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   null | import(".").ReifyBinding,
 * >}
 */
export const setupReifyBinding = (hash, _meta, binding) => {
  if (binding.initial === "undefined") {
    if (binding.write !== "perform") {
      throw new AranExecError("Invalid write in live baseline", {
        hash,
        binding,
      });
    } else {
      return declareGlobal(hash, binding.variable, false);
    }
  } else if (binding.initial === "deadzone") {
    if (binding.write === "ignore") {
      throw new AranExecError("invalid write with dead baseline", {
        hash,
        binding,
      });
    }
    if (binding.duplicable) {
      throw new AranExecError("invalid duplicable with dead baseline", {
        hash,
        binding,
      });
    }
    return thenSequence(
      declareRecord(hash, binding.variable),
      zeroSequence({
        type: "record",
        variable: binding.variable,
        status: "dead",
        write: binding.write,
      }),
    );
  } else {
    throw new AranExecError("invalid initial in root frame", { hash, binding });
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").ReifyMatch,
 *   import("../").LateDeclareVariableOperation,
 *   (
 *     | import("../../../prelude").WarningPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").NativeExternalPrelude
 *   ),
 * >}
 */
export const listReifyLateDeclareEffect = (hash, _meta, _match, operation) =>
  incorporateEffect(
    thenSequence(declareGlobal(hash, operation.variable, true), EMPTY_SEQUENCE),
    hash,
  );

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").ReifyMatch,
 *   import("../").WriteVariableOperation,
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
 *   import("../").WriteVariableOperation,
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
 *     hash: import("../../../../hash").Hash,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 *   makeMissingLookupExpression: (
 *     hash: import("../../../../hash").Hash,
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
