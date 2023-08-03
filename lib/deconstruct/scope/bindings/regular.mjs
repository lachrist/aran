import { flat, map } from "../../../util/index.mjs";

import {
  makeExportEffect,
  makeWriteEffect,
  makeExpressionEffect,
  makeConditionalEffect,
  makeReadExpression,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeEffectStatement,
} from "../../../syntax.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";

import {
  mangleBaseOriginalVariable,
  mangleBaseDeadzoneVariable,
} from "../../../variable.mjs";

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: RegularBinding,
 *   variable: string,
 *   expression: Expression<T>,
 * ) => Effect<T>[]}
 */
const listLiveWriteEffect = (_strict, binding, variable, expression) =>
  binding.writable
    ? flat([
        [makeWriteEffect(mangleBaseOriginalVariable(variable), expression)],
        map(binding.exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseOriginalVariable(variable)),
          ),
        ),
      ])
    : [makeExpressionEffect(makeThrowConstantExpression(variable))];

/**
 * @template T
 * @type {BindingModule<RegularBinding, T>}
 */
export default {
  listBindingVariable: (_strict, binding, variable) =>
    binding.deadzone
      ? [
          mangleBaseDeadzoneVariable(variable),
          mangleBaseOriginalVariable(variable),
        ]
      : [mangleBaseOriginalVariable(variable)],
  listBindingDeclareStatement: (_strict, binding, variable) =>
    binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              mangleBaseDeadzoneVariable(variable),
              makePrimitiveExpression(false),
            ),
          ),
        ]
      : [],
  listBindingInitializeStatement: (_strict, binding, variable, expression) =>
    flat([
      binding.deadzone
        ? [
            makeEffectStatement(
              makeWriteEffect(mangleBaseOriginalVariable(variable), expression),
            ),
          ]
        : [],
      [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true),
          ),
        ),
      ],
    ]),
  makeBindingReadExpression: (_strict, binding, variable) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable)),
          makeReadExpression(mangleBaseOriginalVariable(variable)),
          makeThrowDeadzoneExpression(variable),
        )
      : makeReadExpression(mangleBaseOriginalVariable(variable)),
  makeBindingTypeofExpression: (_strict, binding, variable) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeReadExpression(mangleBaseDeadzoneVariable(variable)),
          makeUnaryExpression(
            "typeof",
            makeReadExpression(mangleBaseOriginalVariable(variable)),
          ),
          makeThrowDeadzoneExpression(variable),
        )
      : makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable)),
        ),
  makeBindingDiscardExpression: (_strict, _binding, _variable) =>
    makePrimitiveExpression(false),
  listBindingWriteEffect: (strict, binding, variable, pure) =>
    binding.deadzone
      ? [
          makeConditionalEffect(
            makeReadExpression(mangleBaseDeadzoneVariable(variable)),
            listLiveWriteEffect(strict, binding, variable, pure),
            [makeExpressionEffect(makeThrowDeadzoneExpression(variable))],
          ),
        ]
      : listLiveWriteEffect(strict, binding, variable, pure),
};
