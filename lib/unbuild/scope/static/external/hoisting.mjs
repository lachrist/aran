import { makeReadCacheExpression } from "../../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../../node.mjs";
import { makeHeaderPrelude } from "../../../prelude.mjs";
import { initSequence } from "../../../sequence.mjs";

/**
 * @type {(
 *   site: {},
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     kind: import(".").HoistingExternalKind,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").HoistingExternalBinding,
 * >}
 */
export const bindHoistingExternal = (_site, context, { kind, variable }) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: "declaration",
        mode: context.mode,
        kind: "var",
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup",
        mode: context.mode,
        variable,
      }),
      ...(context.mode === "sloppy"
        ? [
            makeHeaderPrelude({
              type: "lookup",
              mode: "strict",
              variable,
            }),
          ]
        : []),
    ],
    { kind, deadzone: null },
  );

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
 *     binding: import(".").HoistingExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHoistingExternalLoadExpression = (
  { path },
  context,
  { operation, variable },
) =>
  makeApplyExpression(
    makeReadParameterExpression(`${operation}.${context.mode}`, path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(variable, path)],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").HoistingExternalBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listHoistingExternalSaveEffect = (
  { path },
  context,
  { variable, right },
) => {
  if (right === null) {
    return [];
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeReadParameterExpression(`write.${context.mode}`, path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(variable, path),
            makeReadCacheExpression(right, path),
          ],
          path,
        ),
        path,
      ),
    ];
  }
};
