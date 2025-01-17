import { AranExecError, AranTypeError } from "../../../../error.mjs";
import {
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import {
  makePrefixPrelude,
  makeReifyExternalPrelude,
} from "../../../prelude/index.mjs";
import { initSequence, EMPTY } from "../../../../util/index.mjs";

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../atom").Expression}
 */
export const makeGlobalBelongExpression = (hash, variable) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 *   kind: boolean,
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *   ),
 *   null,
 * >}
 */
export const declareGlobal = (hash, variable, configurable) =>
  initSequence(
    [
      makeReifyExternalPrelude({
        frame: "aran.global",
        variable,
        origin: hash,
      }),
      makePrefixPrelude(
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.hasOwn", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeIntrinsicExpression("aran.global", hash),
              makePrimitiveExpression(variable, hash),
            ],
            hash,
          ),
          EMPTY,
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.global", hash),
                  makePrimitiveExpression(variable, hash),
                  makeDataDescriptorExpression(
                    {
                      value: makeIntrinsicExpression("undefined", hash),
                      writable: true,
                      configurable,
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
          hash,
        ),
      ),
    ],
    null,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeGlobalReadExpression = (hash, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeGlobalTypeofExpression = (hash, { variable }) =>
  makeUnaryExpression(
    "typeof",
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression("aran.global", hash),
        makePrimitiveExpression(variable, hash),
      ],
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     mode: import("../../../mode").Mode,
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeGlobalDiscardExpression = (hash, { mode, variable }) => {
  switch (mode) {
    case "sloppy": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global", hash),
          makePrimitiveExpression(variable, hash),
        ],
        hash,
      );
    }
    case "strict": {
      throw new AranExecError(
        "delete variable in strict mode should have been reported earlier",
        { hash, mode, variable },
      );
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     mode: import("../../../mode").Mode,
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeGlobalWriteExpression = (hash, { mode, variable, right }) => {
  const perform = makeApplyExpression(
    makeIntrinsicExpression("Reflect.set", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global", hash),
      makePrimitiveExpression(variable, hash),
      right,
    ],
    hash,
  );
  switch (mode) {
    case "strict": {
      return makeConditionalExpression(
        perform,
        makePrimitiveExpression(true, hash),
        makeThrowConstantExpression(variable, hash),
        hash,
      );
    }
    case "sloppy": {
      return perform;
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};
