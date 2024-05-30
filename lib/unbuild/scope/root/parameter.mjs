import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { makeReadExpression } from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../../sequence.mjs";
import { AranTypeError } from "../../../error.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   parameter: (
 *     | "this"
 *     | "import.meta"
 *     | "import.dynamic"
 *     | "new.target"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 *   payload: null,
 *   path: import("../../../path").Path,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").HeaderPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeOtherParameterExpression = (mode, parameter, payload, path) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: "parameter",
        mode,
        parameter,
        payload,
      }),
    ],
    makeReadExpression(parameter, path),
  );

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   parameter: (
 *     | "scope.read"
 *     | "scope.write"
 *     | "scope.typeof"
 *     | "scope.discard"
 *   ),
 *   payload: import("../../../estree").Variable,
 *   path: import("../../../path").Path,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import("../../atom").Expression,
 * >}
 */
export const makeScopeParameterExpression = (
  mode,
  parameter,
  payload,
  path,
) => {
  if (
    parameter === "scope.read" ||
    parameter === "scope.write" ||
    parameter === "scope.typeof"
  ) {
    return initSequence(
      [
        makeHeaderPrelude({
          type: "parameter",
          mode,
          parameter,
          payload,
        }),
      ],
      makeReadExpression(parameter, path),
    );
  } else if (parameter === "scope.discard") {
    if (mode === "strict") {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal variable discard in strict mode", path),
      );
    } else if (mode === "sloppy") {
      return initSequence(
        [
          makeHeaderPrelude({
            type: "parameter",
            mode,
            parameter,
            payload,
          }),
        ],
        makeReadExpression(parameter, path),
      );
    } else {
      throw new AranTypeError(mode);
    }
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   mode: "strict",
 *   parameter: (
 *     | "private.has"
 *     | "private.get"
 *     | "private.set"
 *   ),
 *   payload: import("../../../estree").PrivateKey,
 *   tag: import("../../../path").Path,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").HeaderPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makePrivateParameterExpression = (
  mode,
  parameter,
  payload,
  path,
) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: "parameter",
        mode,
        parameter,
        payload,
      }),
    ],
    makeReadExpression(parameter, path),
  );
