import { AranSyntaxError, AranTypeError } from "../../error.mjs";
import { initSequence } from "../../sequence.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "../node.mjs";
import { formatErrorMessage } from "./format.mjs";

/**
 * @type {(
 *   message: string,
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *   import(".").ErrorPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const initErrorExpression = (message, path) =>
  initSequence(
    [
      {
        type: "error",
        data: {
          message,
          origin: path,
        },
      },
    ],
    makePrimitiveExpression(`ARAN_EARLY_ERROR >> ${message} >> ${path}`, path),
  );

/**
 * @type {(
 *   error: import("./error").Error,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../atom").Statement}
 */
export const makePreludeErrorStatement = (
  error,
  { early_syntax_error, ...options },
) => {
  switch (early_syntax_error) {
    case "embed": {
      // Could also be options.base?
      const path = error.origin;
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression(
            "SyntaxError",
            formatErrorMessage(error, options),
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranSyntaxError(formatErrorMessage(error, options));
    }
    default: {
      throw new AranTypeError(early_syntax_error);
    }
  }
};
