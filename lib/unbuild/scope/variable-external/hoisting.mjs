import { pairup } from "../../../util/index.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { EMPTY_SEQUENCE, initSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: import(".").HoistingExternalEntry,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").SetupSequence<[
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
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeHoistingExternalLoadExpression = (
  { path },
  _binding,
  operation,
) =>
  makeApplyExpression(
    makeReadExpression(`${operation.type}.${operation.mode}`, path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operation.variable, path)],
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listHoistingExternalSaveEffect = (
  { path },
  _binding,
  operation,
) => {
  if (operation.right === null) {
    return EMPTY_SEQUENCE;
  } else {
    return makeExpressionEffect(
      makeApplyExpression(
        makeReadExpression(`write.${operation.mode}`, path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makePrimitiveExpression(operation.variable, path),
          makeReadCacheExpression(operation.right, path),
        ],
        path,
      ),
      path,
    );
  }
};
