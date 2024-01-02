import { pairup } from "../../../util/index.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: import(".").HoistingExternalEntry,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").PreludeSequence<[
 *   estree.Variable,
 *   import(".").ExternalBinding,
 * ]>}
 */
export const bindHoistingExternal = ({}, [variable, kind], { mode }) =>
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
    pairup(variable, { kind, deadzone: null }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingExternalBinding,
 *   operation: import("..").VariableLoadOperation,
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
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingExternalBinding,
 *   operation: import("..").VariableSaveOperation,
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
