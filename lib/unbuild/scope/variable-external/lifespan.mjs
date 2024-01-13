import { pairup } from "../../../util/index.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { makeEarlyErrorExpression } from "../../early-error.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence, prependSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoist: import("../../query/hoist").LifespanHoist,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").ExternalBinding,
 *   ],
 * >}
 */
export const bindLifespan = ({}, { variable, kind }, { mode }) =>
  initSequence(
    [
      makeHeaderPrelude({
        type: `declare.${mode}`,
        kind: "var",
        variable,
      }),
    ],
    pairup(variable, { kind, deadzone: null }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").LifespanExternalBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLifespanLoadExpression = ({ path }, _binding, operation) => {
  /** @type {import("../../../header").LookupParameter | "discard.strict"} */
  const parameter = `${operation.type}.${operation.mode}`;
  if (parameter === "discard.strict") {
    return makeEarlyErrorExpression(
      `Illegal strict discard of ${operation.variable}`,
      path,
    );
  } else {
    return prependSequence(
      [
        makeHeaderPrelude({
          type: parameter,
          variable: operation.variable,
        }),
      ],
      makeApplyExpression(
        makeReadExpression(parameter, path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(operation.variable, path)],
        path,
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").LifespanExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listLifespanSaveEffect = ({ path }, _binding, operation) => {
  if (operation.right === null) {
    return EMPTY_EFFECT;
  } else {
    return makeExpressionEffect(
      prependSequence(
        [
          makeHeaderPrelude({
            type: `write.${operation.mode}`,
            variable: operation.variable,
          }),
        ],
        makeApplyExpression(
          makeReadExpression(`write.${operation.mode}`, path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(operation.variable, path),
            makeReadCacheExpression(operation.right, path),
          ],
          path,
        ),
      ),
      path,
    );
  }
};
