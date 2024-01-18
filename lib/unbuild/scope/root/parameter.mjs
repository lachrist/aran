import { getLookupParameter, makeLookupHeader } from "../../../header.mjs";
import { makeEarlyErrorExpression } from "../../early-error.mjs";
import { makeReadExpression } from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { prependSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   parameter: import("../../../header").StraightParameter,
 *   path: unbuild.Path,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeStraightParameterExpression = (_mode, parameter, path) =>
  prependSequence(
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
 * ) => import("../../sequence").ExpressionSequence}
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
      "Illegal variable discard in strict mode",
      path,
    );
  } else {
    return prependSequence(
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
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makePrivateParameterExpression = (mode, operation, key, path) =>
  prependSequence(
    [
      makeHeaderPrelude({
        type: `private.${operation}`,
        mode,
        key,
      }),
    ],
    makeReadExpression(`private.${operation}`, path),
  );
