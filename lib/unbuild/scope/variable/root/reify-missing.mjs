import { AranTypeError } from "../../../../report.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowMissingExpression } from "../error.mjs";

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeMissingReadExpression = (hash, { variable }) =>
  makeThrowMissingExpression(variable, hash);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   operation: {},
 * ) => import("../../../atom").Expression}
 */
export const makeMissingTypeofExpression = (hash, _operation) =>
  makePrimitiveExpression("undefined", hash);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   operation: {},
 * ) => import("../../../atom").Expression}
 */
export const makeMissingDiscardExpression = (hash, _operation) =>
  makePrimitiveExpression(true, hash);

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   operation: {
 *     mode: import("../../../mode").Mode,
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../atom").Expression}
 */
export const makeMissingWriteExpression = (hash, { mode, variable, right }) => {
  switch (mode) {
    case "strict": {
      return makeThrowMissingExpression(variable, hash);
    }
    case "sloppy": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global", hash),
          makePrimitiveExpression(variable, hash),
          right,
        ],
        hash,
      );
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};
