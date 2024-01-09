import { pairup } from "../../../util/index.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: import("../../query/hoist").ClosureHoist,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").HoistingExternalBinding,
 *   ],
 * >}
 */
export const bindHoistingExternal = ({}, { variable, kind }, { mode }) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: "declare.var",
        mode,
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup.static",
        mode,
        variable,
      }),
      ...(mode === "sloppy"
        ? [
            makeHeaderPrelude({
              type: "lookup.static",
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
    return EMPTY_EFFECT;
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
