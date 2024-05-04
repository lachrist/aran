import { getLookupParameter, makeLookupHeader } from "../../../header.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { makeReadExpression } from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../../sequence.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   parameter: import("../../../header").StraightParameter,
 *   path: unbuild.Path,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").HeaderPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeStraightParameterExpression = (_mode, parameter, path) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: parameter,
        mode: null,
      }),
    ],
    makeReadExpression(parameter, path),
  );

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeLookupParameterExpression = (
  mode,
  operation,
  variable,
  path,
) => {
  const header = makeLookupHeader(mode, operation, variable);
  if (header === null) {
    return makeEarlyErrorExpression(
      makeRegularEarlyError("Illegal variable discard in strict mode", path),
    );
  } else {
    return initSequence(
      [makeHeaderPrelude(header)],
      makeReadExpression(getLookupParameter(header), path),
    );
  }
};

/**
 * @type {(
 *   mode: "strict",
 *   operation: "has" | "get" | "set",
 *   key: estree.PrivateKey,
 *   tag: unbuild.Path,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").HeaderPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makePrivateParameterExpression = (mode, operation, key, path) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: `private.${operation}`,
        mode,
        key,
      }),
    ],
    makeReadExpression(`private.${operation}`, path),
  );
