import { map } from "../../../util/index.mjs";

import {
  makeExportEffect,
  makeExpressionEffect,
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
  makeBaseReadExpression,
  makeBaseWriteEffect,
  mangleBaseDeadzoneVariable,
  mangleBaseOriginalVariable,
} from "../../layer/index.mjs";

/** @typedef {import("../../layer/build.mjs").BaseVariable} BaseVariable */

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
    ? [
        makeBaseWriteEffect(
          mangleBaseOriginalVariable(variable),
          expression,
          tag,
        ),
        ...map(binding.exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeBaseReadExpression(mangleBaseDeadzoneVariable(variable), tag),
            tag,
          ),
        ),
      ]
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
            makeBaseWriteEffect(
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
            makeBaseWriteEffect(
              mangleBaseOriginalVariable(variable),
              expression,
              tag,
            ),
            tag,
          ),
        ]
      : []),
    makeEffectStatement(
      makeBaseWriteEffect(
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
          makeBaseReadExpression(mangleBaseDeadzoneVariable(variable), tag),
          makeBaseReadExpression(mangleBaseOriginalVariable(variable), tag),
          makeThrowDeadzoneExpression(variable, tag),
          tag,
        )
      : makeBaseReadExpression(mangleBaseOriginalVariable(variable), tag),
  makeBindingTypeofExpression: (_strict, binding, variable, tag) =>
    binding.deadzone
      ? makeConditionalExpression(
          makeBaseReadExpression(mangleBaseDeadzoneVariable(variable), tag),
          makeUnaryExpression(
            "typeof",
            makeBaseReadExpression(mangleBaseOriginalVariable(variable), tag),
            tag,
          ),
          makeThrowDeadzoneExpression(variable, tag),
          tag,
        )
      : makeUnaryExpression(
          "typeof",
          makeBaseReadExpression(mangleBaseOriginalVariable(variable), tag),
          tag,
        ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, tag) =>
    makePrimitiveExpression(false, tag),
  listBindingWriteEffect: (strict, binding, variable, pure, tag) =>
    binding.deadzone
      ? [
          makeConditionalEffect(
            makeBaseReadExpression(mangleBaseDeadzoneVariable(variable), tag),
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
