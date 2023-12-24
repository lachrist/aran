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
 *   kind: import(".").HoistingExternalKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").HoistingExternalBinding,
 * >}
 */
export const bindHoistingExternal = ({}, kind, { mode, variable }) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: "declaration",
        mode,
        kind: "var",
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup",
        mode,
        variable,
      }),
      ...(mode === "sloppy"
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
 *   binding: import(".").HoistingExternalBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHoistingExternalLoadExpression = (
  { path },
  _binding,
  operation,
) =>
  makeApplyExpression(
    makeReadParameterExpression(`${operation.type}.${operation.mode}`, path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operation.variable, path)],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").HoistingExternalBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listHoistingExternalSaveEffect = (
  { path },
  _binding,
  operation,
) => {
  if (operation.right === null) {
    return [];
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeReadParameterExpression(`write.${operation.mode}`, path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(operation.variable, path),
            makeReadCacheExpression(operation.right, path),
          ],
          path,
        ),
        path,
      ),
    ];
  }
};
