import { map } from "../../../../util/index.mjs";

import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeEffectStatement,
  makeReadExpression,
  makeWriteEffect,
} from "../../../node.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";

import {
  mangleBaseDeadzoneVariable,
  mangleBaseOriginalVariable,
} from "../../../mangle.mjs";

/**
 * @typedef {{
 *   type: "regular";
 *   deadzone: boolean;
 *   writable: boolean;
 *   exports: estree.Specifier[];
 * }} RegularBinding
 */

/**
 * @template S
 * @param {boolean} _strict
 * @param {RegularBinding} binding
 * @param {estree.Variable} variable
 * @param {aran.Expression<unbuild.Atom<S>>} expression
 * @param {S} serial
 * @returns {aran.Effect<unbuild.Atom<S>>[]}
 */
const listLiveWriteEffect = (_strict, binding, variable, expression, serial) =>
  binding.writable
    ? [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          expression,
          serial,
          false,
        ),
        ...map(binding.exports, (specifier) =>
          makeExportEffect(
            specifier,
            /** @type {aran.Expression<unbuild.Atom<S>>} */ (
              makeReadExpression(mangleBaseDeadzoneVariable(variable), serial)
            ),
            serial,
          ),
        ),
      ]
    : [
        makeExpressionEffect(
          makeThrowConstantExpression(variable, serial),
          serial,
        ),
      ];

/**
 * @template T
 * @type {import("./module.js").BindingModule<RegularBinding, T>}
 */
export default {
  listBindingVariable: (_strict, binding, variable) =>
    binding.deadzone
      ? [
          mangleBaseDeadzoneVariable(variable),
          mangleBaseOriginalVariable(variable),
        ]
      : [mangleBaseOriginalVariable(variable)],
  listBindingDeclareStatement: (_strict, binding, variable, serial) =>
    binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              mangleBaseDeadzoneVariable(variable),
              makePrimitiveExpression(false, serial),
              serial,
              false,
            ),
            serial,
          ),
        ]
      : [],
  listBindingInitializeStatement: (
    _strict,
    binding,
    variable,
    expression,
    serial,
  ) => [
    ...(binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              mangleBaseOriginalVariable(variable),
              expression,
              serial,
              false,
            ),
            serial,
          ),
        ]
      : []),
    makeEffectStatement(
      makeWriteEffect(
        mangleBaseDeadzoneVariable(variable),
        makePrimitiveExpression(true, serial),
        serial,
        false,
      ),
      serial,
    ),
  ],
  makeBindingReadExpression: (_strict, binding, variable, serial) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
          makeReadExpression(mangleBaseOriginalVariable(variable), serial),
          makeThrowDeadzoneExpression(variable, serial),
          serial,
        )
      : makeReadExpression(mangleBaseOriginalVariable(variable), serial),
  makeBindingTypeofExpression: (_strict, binding, variable, serial) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
          makeUnaryExpression(
            "typeof",
            makeReadExpression(mangleBaseOriginalVariable(variable), serial),
            serial,
          ),
          makeThrowDeadzoneExpression(variable, serial),
          serial,
        )
      : makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable), serial),
          serial,
        ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, serial) =>
    makePrimitiveExpression(false, serial),
  listBindingWriteEffect: (strict, binding, variable, right, serial) =>
    binding.deadzone
      ? [
          makeConditionalEffect(
            makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
            listLiveWriteEffect(
              strict,
              binding,
              variable,
              makeReadExpression(right, serial),
              serial,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, serial),
                serial,
              ),
            ],
            serial,
          ),
        ]
      : listLiveWriteEffect(
          strict,
          binding,
          variable,
          makeReadExpression(right, serial),
          serial,
        ),
};
