import { flat, map } from "../../../util/index.mjs";

import {
  makeExportEffect,
  makeWriteEffect,
  makeExpressionEffect,
  makeReadExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeEffectStatement,
} from "../../../node.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";

import {
  mangleBaseOriginalVariable,
  mangleBaseDeadzoneVariable,
} from "../variable.mjs";

/**
 * @typedef {{
 *   type: "regular";
 *   deadzone: boolean;
 *   writable: boolean;
 *   exports: Specifier[];
 * }} RegularBinding
 */

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: RegularBinding,
 *   variable: Variable,
 *   expression: Expression<T>,
 *   tag: T,
 * ) => Effect<T>[]}
 */
const listLiveWriteEffect = (_strict, binding, variable, expression, tag) =>
  binding.writable
    ? flat([
        [
          makeWriteEffect(
            mangleBaseOriginalVariable(variable),
            expression,
            tag,
          ),
        ],
        map(binding.exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseOriginalVariable(variable), tag),
            tag,
          ),
        ),
      ])
    : [makeExpressionEffect(makeThrowConstantExpression(variable, tag), tag)];

/**
 * @template T
 * @type {import("./module.d.ts").BindingModule<RegularBinding, T>}
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
  ) =>
    flat([
      binding.deadzone
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
        : [],
      [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true, tag),
            tag,
          ),
          tag,
        ),
      ],
    ]),
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
  listBindingWriteEffect: (strict, binding, variable, pure, tag) =>
    binding.deadzone
      ? [
          makeConditionalEffect(
            makeReadExpression(mangleBaseDeadzoneVariable(variable), tag),
            listLiveWriteEffect(strict, binding, variable, pure, tag),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, tag),
                tag,
              ),
            ],
            tag,
          ),
        ]
      : listLiveWriteEffect(strict, binding, variable, pure, tag),
};
