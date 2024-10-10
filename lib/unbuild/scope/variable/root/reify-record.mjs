import { AranTypeError } from "../../../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../../../node.mjs";
import {
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
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
 *     initialization: "yes" | "no",
 *   },
 *   closure: boolean,
 * ) => "yes" | "no" | "maybe"}
 */
const getInitialization = (binding, closure) => {
  if (binding === null) {
    return "maybe";
  } else {
    switch (binding.initialization) {
      case "yes": {
        return "yes";
      }
      case "no": {
        return closure ? "maybe" : "no";
      }
      default: {
        throw new AranTypeError(binding.initialization);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
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
 *   hash: import("../../../../hash").Hash,
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
 *   hash: import("../../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeRecordBelongExpression = (hash, { variable }) =>
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
 *   hash: import("../../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../../sequence").Sequence<
 *   (
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *   ),
 *   null,
 * >}
 */
export const declareRecord = (hash, variable) =>
  initSequence(
    [
      makeReifyExternalPrelude({
        frame: "aran.record",
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
 * @type {import("../../perform").PerformExpression<
 *   import(".").ReifyBind,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     closure: boolean,
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
  const initialization = getInitialization(binding, closure);
  switch (initialization) {
    case "yes": {
      return zeroSequence(makeLiveReadExpression(hash, variable));
    }
    case "no": {
      return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
    }
    case "maybe": {
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
      throw new AranTypeError(initialization);
    }
  }
};

/**
 * @type {import("../../perform").PerformExpression<
 *   import(".").ReifyBind,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     closure: boolean,
 *   },
 *   import("../../../prelude").MetaDeclarationPrelude
 * >}
 */
export const makeRecordTypeoExpression = (
  hash,
  meta,
  { binding },
  { variable, closure },
) => {
  const initialization = getInitialization(binding, closure);
  switch (initialization) {
    case "yes": {
      return zeroSequence(
        makeUnaryExpression(
          "typeof",
          makeLiveReadExpression(hash, variable),
          hash,
        ),
      );
    }
    case "no": {
      return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
    }
    case "maybe": {
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
      throw new AranTypeError(initialization);
    }
  }
};

/**
 * @type {import("../../perform").PerformExpression<
 *   import(".").ReifyBind,
 *   {},
 *   never
 * >}
 */
export const makeRecordDiscardExpression = (hash, _meta, _bind, _operation) =>
  zeroSequence(makePrimitiveExpression(false, hash));

/**
 * @type {import("../../perform").PerformExpression<
 *   import(".").ReifyBind,
 *   {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *     closure: boolean,
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
  const initialization = getInitialization(binding, closure);
  switch (initialization) {
    case "yes": {
      return zeroSequence(
        makeLiveWriteExpression(hash, "unknown", variable, right),
      );
    }
    case "no": {
      return zeroSequence(
        makeSequenceExpression(
          [makeExpressionEffect(right, hash)],
          makeThrowDeadzoneExpression(variable, hash),
          hash,
        ),
      );
    }
    case "maybe": {
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
      throw new AranTypeError(initialization);
    }
  }
};
