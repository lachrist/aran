import { AranTypeError } from "../../../../error.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowMissingExpression } from "../error.mjs";

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeMissingReadExpression = (hash, { variable }) =>
  makeThrowMissingExpression(variable, hash);

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {},
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeMissingTypeofExpression = (hash, _operation) =>
  makePrimitiveExpression("undefined", hash);

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {},
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeMissingDiscardExpression = (hash, _operation) =>
  makePrimitiveExpression(true, hash);

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     mode: import("../../../mode.d.ts").Mode,
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom.d.ts").Expression,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
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
          makeIntrinsicExpression("aran.global_object", hash),
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
