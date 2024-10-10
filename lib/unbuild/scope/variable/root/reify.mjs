import { AranExecError, AranTypeError } from "../../../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { makeDataDescriptorExpression } from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X__,
  thenSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
import { incorporateEffect } from "../../../prelude/index.mjs";
import { concat_ } from "../../../../util/index.mjs";
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
  makeRecordTypeoExpression,
  makeRecordWriteExpression,
} from "./reify-record.mjs";
import {
  makeMissingDiscardExpression,
  makeMissingReadExpression,
  makeMissingTypeofExpression,
  makeMissingWriteExpression,
} from "./reify-missing.mjs";

/**
 * @type {(
 *   write: "report" | "perform",
 * ) => boolean}
 */
const toWritable = (write) => {
  switch (write) {
    case "perform": {
      return true;
    }
    case "report": {
      return false;
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {import("../../perform").Setup<
 *   import("../../../annotation/hoisting").Binding,
 *   (
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   null | import(".").ReifyBinding,
 * >}
 */
export const setupReifyBinding = (hash, _meta, binding) => {
  switch (binding.baseline) {
    case "live": {
      if (binding.write !== "perform") {
        throw new AranExecError("Invalid write in live baseline", {
          hash,
          binding,
        });
      } else {
        return declareGlobal(hash, binding.variable, false);
      }
    }
    case "dead": {
      if (binding.write === "ignore") {
        throw new AranExecError("Invalid write in dead baseline", {
          hash,
          binding,
        });
      } else {
        return thenSequence(
          declareRecord(hash, binding.variable),
          zeroSequence({
            type: "record",
            variable: binding.variable,
            initialization: "no",
            write: binding.write,
          }),
        );
      }
    }
    default: {
      throw new AranTypeError(binding.baseline);
    }
  }
};

/**
 * @type {import("../../perform").Perform<
 *   import(".").ReifyBind,
 *   import("../").InitializeVariableOperation,
 *   import("../../../../sequence").Sequence<
 *     import("../../../prelude").MetaDeclarationPrelude,
 *     {
 *       main: import("../../../atom").Effect[],
 *       auxi: import(".").ReifyBinding,
 *     },
 *   >,
 * >}
 */
export const listReifyInitializeEffect = (hash, meta, bind, operation) => {
  if (bind.binding === null) {
    throw new AranExecError("missing binding for initialization", {
      hash,
      meta,
      bind,
      operation,
    });
  } else {
    switch (bind.binding.initialization) {
      case "yes": {
        throw new AranExecError("duplicate initialization", {
          hash,
          meta,
          bind,
          operation,
        });
      }
      case "no": {
        return zeroSequence({
          main: [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.record", hash),
                  makePrimitiveExpression(operation.variable, hash),
                  makeDataDescriptorExpression(
                    {
                      value:
                        operation.right !== null
                          ? operation.right
                          : makeIntrinsicExpression("undefined", hash),
                      writable: toWritable(bind.binding.write),
                      configurable: false,
                      enumerable: true,
                    },
                    hash,
                  ),
                ],
                hash,
              ),
              hash,
            ),
          ],
          auxi: {
            variable: operation.variable,
            write: bind.binding.write,
            initialization: "yes",
          },
        });
      }
      default: {
        throw new AranTypeError(bind.binding.initialization);
      }
    }
  }
};

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").ReifyBind,
 *   import("../").LateDeclareVariableOperation,
 *   (
 *     | import("../../../prelude").WarningPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").NativeExternalPrelude
 *   ),
 * >}
 */
export const listReifyLateDeclareEffect = (hash, _meta, _binding, operation) =>
  incorporateEffect(
    thenSequence(declareGlobal(hash, operation.variable, true), EMPTY_SEQUENCE),
    hash,
  );

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").ReifyBind,
 *   import("../").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listReifyWriteEffect = (
  hash,
  meta,
  bind,
  { variable, closure, right },
) => {
  if (bind.binding === null) {
    return incorporateEffect(
      bindSequence(
        cacheConstant(forkMeta((meta = nextMeta(meta))), right, hash),
        (right) =>
          liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              liftSequence_X__(
                makeConditionalExpression,
                makeRecordBelongExpression(hash, { variable }),
                makeRecordWriteExpression(hash, meta, bind, {
                  variable,
                  closure,
                  right: makeReadCacheExpression(right, hash),
                }),
                makeConditionalExpression(
                  makeGlobalBelongExpression(hash, { variable }),
                  makeGlobalWriteExpression(hash, bind, {
                    variable,
                    right: makeReadCacheExpression(right, hash),
                  }),
                  makeMissingWriteExpression(hash, bind, {
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
      ),
      hash,
    );
  } else {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        makeRecordWriteExpression(hash, meta, bind, {
          variable,
          closure,
          right,
        }),
        hash,
      ),
    );
  }
};

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").ReifyBind,
 *   import("../").WriteSloppyFunctionVariableOperation,
 *   never,
 * >}
 */
export const listReifyWriteSloppyFunctionEffect = (
  hash,
  _meta,
  bind,
  { variable, right },
) => {
  if (right === null) {
    return EMPTY_SEQUENCE;
  } else {
    return zeroSequence([
      makeExpressionEffect(
        makeGlobalWriteExpression(hash, bind, {
          variable,
          right: makeReadExpression(right, hash),
        }),
        hash,
      ),
    ]);
  }
};

/**
 * @type {<W, O extends { variable: import("estree-sentry").VariableName }>(
 *   makeRecordLookupExpression: import("../../perform").PerformExpression<
 *     import(".").ReifyBind,
 *     O,
 *     W,
 *   >,
 *   makeGlobalLookupExpression: (
 *     hash: import("../../../../hash").Hash,
 *     bind: import(".").ReifyBind,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 *   makeMissingLookupExpression: (
 *     hash: import("../../../../hash").Hash,
 *     bind: import(".").ReifyBind,
 *     operation: O,
 *   ) => import("../../../atom").Expression,
 * ) => import("../../perform").PerformExpression<
 *   import(".").ReifyBind,
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
  (hash, meta, bind, operation) => {
    if (bind.binding === null) {
      return liftSequence_X__(
        makeConditionalExpression,
        makeRecordBelongExpression(hash, operation),
        makeRecordLookupExpression(hash, meta, bind, operation),
        makeConditionalExpression(
          makeGlobalBelongExpression(hash, operation),
          makeGlobalLookupExpression(hash, bind, operation),
          makeMissingLookupExpression(hash, bind, operation),
          hash,
        ),
        hash,
      );
    } else {
      return makeRecordLookupExpression(hash, meta, bind, operation);
    }
  };

export const makeReifyReadExpression = compileOperation(
  makeRecordReadExpression,
  makeGlobalReadExpression,
  makeMissingReadExpression,
);

export const makeReifyTypeofExpression = compileOperation(
  makeRecordTypeoExpression,
  makeGlobalTypeofExpression,
  makeMissingTypeofExpression,
);

export const makeReifyDiscardExpression = compileOperation(
  makeRecordDiscardExpression,
  makeGlobalDiscardExpression,
  makeMissingDiscardExpression,
);
