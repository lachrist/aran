import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
  tellHeader,
} from "../../node.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write",
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache  | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalSaveEffect = (
  { path },
  context,
  { operation, variable, right },
) => {
  if (right === null) {
    return [];
  } else {
    return [
      makeExpressionEffect(
        tellHeader(
          makeApplyExpression(
            makeReadParameterExpression(`${operation}.${context.mode}`, path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(variable, path),
              makeReadCacheExpression(right, path),
            ],
            path,
          ),
          {
            type: "lookup",
            mode: context.mode,
            variable,
          },
        ),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExternalLoadExpression = (
  { path },
  context,
  { operation, variable },
) =>
  tellHeader(
    makeApplyExpression(
      makeReadParameterExpression(`${operation}.${context.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(variable, path)],
      path,
    ),
    {
      type: "lookup",
      mode: context.mode,
      variable,
    },
  );
