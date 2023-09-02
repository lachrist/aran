import {
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
} from "../../syntax.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";

import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../error.mjs";

/**
 * @template T
 * @type {BindingModule<HiddenBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, binding, variable) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable),
            makeIntrinsicExpression("aran.global.record.variables"),
          ),
          makeThrowDuplicateExpression(variable),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.global.record.variables"),
            makePrimitiveExpression(variable),
            makePrimitiveExpression(binding.writable),
          ),
        ),
      ),
    ),
  ],
  listBindingInitializeStatement: (_strict, _binding, variable, expression) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global.record.values"),
          makePrimitiveExpression(variable),
          expression,
        ),
      ),
    ),
  ],
  makeBindingReadExpression: (_strict, _binding, variable) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable),
        makeIntrinsicExpression("aran.global.record.values"),
      ),
      makeGetExpression(
        makeIntrinsicExpression("aran.global.record.values"),
        makePrimitiveExpression(variable),
      ),
      makeThrowDeadzoneExpression(variable),
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable),
        makeIntrinsicExpression("aran.global.record.values"),
      ),
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.global.record.values"),
          makePrimitiveExpression(variable),
        ),
      ),
      makeThrowDeadzoneExpression(variable),
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable) =>
    makePrimitiveExpression(false),
  listBindingWriteEffect: (_strict, binding, variable, pure) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.global.record.values"),
        ),
        binding.writable
          ? makeSetExpression(
              true,
              makeIntrinsicExpression("aran.global.record.values"),
              makePrimitiveExpression(variable),
              pure,
            )
          : makeThrowConstantExpression(variable),
        makeThrowDeadzoneExpression(variable),
      ),
    ),
  ],
};
