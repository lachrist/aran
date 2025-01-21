import { AranExecError, AranTypeError } from "../../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  listExpressionEffect,
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../../../node.mjs";
import {
  flatenTree,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../../util/index.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import {
  makePrefixPrelude,
  incorporateExpression,
  makeReifyExternalPrelude,
} from "../../../prelude/index.mjs";

/**
 * @type {(
 *   binding: null | {
 *     status: import(".").Status,
 *   },
 *   closure: import("..").Closure,
 * ) => import(".").Status}
 */
const updateStatus = (binding, closure) => {
  if (binding === null) {
    return "schrodinger";
  } else {
    switch (binding.status) {
      case "live": {
        return "live";
      }
      case "dead": {
        switch (closure) {
          case "internal": {
            return "dead";
          }
          case "external": {
            return "schrodinger";
          }
          default: {
            throw new AranTypeError(closure);
          }
        }
      }
      case "schrodinger": {
        return "schrodinger";
      }
      default: {
        throw new AranTypeError(binding.status);
      }
    }
  }
};

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
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../atom").Expression}
 */
const makeLiveReadExpression = (hash, variable) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.record", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   write: "unknown" | "report" | "perform",
 *   variable: import("estree-sentry").VariableName,
 *   right: import("../../../atom").Expression,
 * ) => import("../../../atom").Expression}
 */
const makeLiveWriteExpression = (hash, write, variable, right) => {
  switch (write) {
    case "unknown": {
      return makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeIntrinsicExpression("aran.record", hash),
            makePrimitiveExpression(variable, hash),
            right,
          ],
          hash,
        ),
        makePrimitiveExpression(true, hash),
        makeThrowConstantExpression(variable, hash),
        hash,
      );
    }
    case "perform": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.record", hash),
          makePrimitiveExpression(variable, hash),
          right,
        ],
        hash,
      );
    }
    case "report": {
      return makeThrowConstantExpression(variable, hash);
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../atom").Expression}
 */
export const makeRecordBelongExpression = (hash, variable) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.record", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 *   options: {
 *     dynamic: false,
 *     kinds: import(".").RootKind[],
 *   },
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *   ),
 *   null,
 * >}
 */
export const declareRecord = (hash, variable, { dynamic, kinds }) =>
  initSequence(
    [
      makeReifyExternalPrelude({
        dynamic,
        kinds,
        variable,
        origin: hash,
      }),
      makePrefixPrelude(
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeIntrinsicExpression("aran.record", hash),
              makePrimitiveExpression(variable, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
            ],
            hash,
          ),
          hash,
        ),
      ),
    ],
    null,
  );

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").ReifyMatch,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     closure: import("..").Closure,
 *   },
 *   import("../../../prelude").MetaDeclarationPrelude
 * >}
 */
export const makeRecordReadExpression = (
  hash,
  meta,
  { binding },
  { variable, closure },
) => {
  const status = updateStatus(binding, closure);
  switch (status) {
    case "live": {
      return zeroSequence(makeLiveReadExpression(hash, variable));
    }
    case "dead": {
      return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
    }
    case "schrodinger": {
      return incorporateExpression(
        mapSequence(
          cacheConstant(meta, makeLiveReadExpression(hash, variable), hash),
          (result) =>
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(result, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(variable, hash),
              makeReadCacheExpression(result, hash),
              hash,
            ),
        ),
        hash,
      );
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").ReifyMatch,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     closure: import("..").Closure,
 *   },
 *   import("../../../prelude").MetaDeclarationPrelude
 * >}
 */
export const makeRecordTypeofExpression = (
  hash,
  meta,
  { binding },
  { variable, closure },
) => {
  const status = updateStatus(binding, closure);
  switch (status) {
    case "live": {
      return zeroSequence(
        makeUnaryExpression(
          "typeof",
          makeLiveReadExpression(hash, variable),
          hash,
        ),
      );
    }
    case "dead": {
      return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
    }
    case "schrodinger": {
      return incorporateExpression(
        mapSequence(
          cacheConstant(meta, makeLiveReadExpression(hash, variable), hash),
          (result) =>
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(result, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(variable, hash),
              makeUnaryExpression(
                "typeof",
                makeReadCacheExpression(result, hash),
                hash,
              ),
              hash,
            ),
        ),
        hash,
      );
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").ReifyMatch,
 *   {},
 *   never
 * >}
 */
export const makeRecordDiscardExpression = (hash, _meta, _bind, _operation) =>
  zeroSequence(makePrimitiveExpression(false, hash));

/**
 * @type {import("../../api").Perform<
 *   import(".").ReifyMatch,
 *   import("..").InitializeVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 *   [
 *     import("../../../atom").Effect[],
 *     import(".").ReifyBinding,
 *   ],
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
    if (bind.binding.status !== "dead") {
      throw new AranExecError("duplicate initialization", {
        hash,
        meta,
        bind,
        operation,
      });
    } else {
      return zeroSequence([
        [
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
        {
          variable: operation.variable,
          write: bind.binding.write,
          status: "live",
        },
      ]);
    }
  }
};

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").ReifyMatch,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *     closure: import("..").Closure,
 *   },
 *   import("../../../prelude").MetaDeclarationPrelude
 * >}
 */
export const makeRecordWriteExpression = (
  hash,
  meta,
  { binding },
  { variable, right, closure },
) => {
  const status = updateStatus(binding, closure);
  switch (status) {
    case "live": {
      return zeroSequence(
        makeLiveWriteExpression(hash, "unknown", variable, right),
      );
    }
    case "dead": {
      return zeroSequence(
        makeSequenceExpression(
          flatenTree(listExpressionEffect(right, hash)),
          makeThrowDeadzoneExpression(variable, hash),
          hash,
        ),
      );
    }
    case "schrodinger": {
      return incorporateExpression(
        mapSequence(cacheConstant(meta, right, hash), (right) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.get", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.record", hash),
                  makePrimitiveExpression(variable, hash),
                ],
                hash,
              ),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            makeThrowDeadzoneExpression(variable, hash),
            makeLiveWriteExpression(
              hash,
              binding === null ? "unknown" : binding.write,
              variable,
              makeReadCacheExpression(right, hash),
            ),
            hash,
          ),
        ),
        hash,
      );
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};
