import { map } from "../../../util/index.mjs";

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
} from "../../mangle.mjs";

/**
 * @typedef {{
 *   type: "regular";
 *   deadzone: boolean;
 *   writable: boolean;
 *   exports: estree.Specifier[];
 * }} RegularBinding
 */

// * @type {<T>(
// *   strict: boolean,
// *   binding: RegularBinding,
// *   variable: estree.Variable,
// *   expression: aran.Expression<unbuild.Atom<T>>,
// *   tag: T,
// * ) => aran.Effect<unbuild.Atom<T>>[]}

/**
 * @template T
 * @param {boolean} _strict
 * @param {RegularBinding} binding
 * @param {estree.Variable} variable
 * @param {aran.Expression<unbuild.Atom<T>>} expression
 * @param {T} tag
 * @returns {aran.Effect<unbuild.Atom<T>>[]}
 */
const listLiveWriteEffect = (_strict, binding, variable, expression, tag) =>
  binding.writable
    ? [
        makeWriteEffect(mangleBaseOriginalVariable(variable), expression, tag),
        ...map(binding.exports, (specifier) =>
          makeExportEffect(
            specifier,
            /** @type {aran.Expression<unbuild.Atom<T>>} */ (
              makeReadExpression(mangleBaseDeadzoneVariable(variable), tag)
            ),
            tag,
          ),
        ),
      ]
    : [makeExpressionEffect(makeThrowConstantExpression(variable, tag), tag)];

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
  listBindingDeclareStatement: (_strict, binding, variable, tag) =>
    binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              mangleBaseDeadzoneVariable(variable),
              makePrimitiveExpression(false, tag),
              tag,
            ),
            tag,
          ),
        ]
      : [],
  listBindingInitializeStatement: (
    _strict,
    binding,
    variable,
    expression,
    tag,
  ) => [
    ...(binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              mangleBaseOriginalVariable(variable),
              expression,
              tag,
            ),
            tag,
          ),
        ]
      : []),
    makeEffectStatement(
      makeWriteEffect(
        mangleBaseDeadzoneVariable(variable),
        makePrimitiveExpression(true, tag),
        tag,
      ),
      tag,
    ),
  ],
  makeBindingReadExpression: (_strict, binding, variable, tag) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), tag),
          makeReadExpression(mangleBaseOriginalVariable(variable), tag),
          makeThrowDeadzoneExpression(variable, tag),
          tag,
        )
      : makeReadExpression(mangleBaseOriginalVariable(variable), tag),
  makeBindingTypeofExpression: (_strict, binding, variable, tag) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), tag),
          makeUnaryExpression(
            "typeof",
            makeReadExpression(mangleBaseOriginalVariable(variable), tag),
            tag,
          ),
          makeThrowDeadzoneExpression(variable, tag),
          tag,
        )
      : makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable), tag),
          tag,
        ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, tag) =>
    makePrimitiveExpression(false, tag),
  listBindingWriteEffect: (strict, binding, variable, right, tag) =>
    binding.deadzone
      ? [
          makeConditionalEffect(
            makeReadExpression(mangleBaseDeadzoneVariable(variable), tag),
            listLiveWriteEffect(
              strict,
              binding,
              variable,
              makeReadExpression(right, tag),
              tag,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, tag),
                tag,
              ),
            ],
            tag,
          ),
        ]
      : listLiveWriteEffect(
          strict,
          binding,
          variable,
          makeReadExpression(right, tag),
          tag,
        ),
};
