import {
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeReadExpression,
} from "../../../node.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../../intrinsic.mjs";

import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../error.mjs";

/**
 * @typedef {{
 *   type: "hidden";
 *   writable: boolean;
 * }} HiddenBinding
 */

/**
 * @template T
 * @type {import("./module.js").BindingModule<HiddenBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, binding, variable, serial) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, serial),
            makeIntrinsicExpression("aran.record.variables", serial),
            serial,
          ),
          makeThrowDuplicateExpression(variable, serial),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.variables", serial),
            makePrimitiveExpression(variable, serial),
            makePrimitiveExpression(binding.writable, serial),
            serial,
          ),
          serial,
        ),
        serial,
      ),
      serial,
    ),
  ],
  listBindingInitializeStatement: (
    _strict,
    _binding,
    variable,
    expression,
    serial,
  ) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values", serial),
          makePrimitiveExpression(variable, serial),
          expression,
          serial,
        ),
        serial,
      ),
      serial,
    ),
  ],
  makeBindingReadExpression: (_strict, _binding, variable, serial) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, serial),
        makeIntrinsicExpression("aran.record.values", serial),
        serial,
      ),
      makeGetExpression(
        makeIntrinsicExpression("aran.record.values", serial),
        makePrimitiveExpression(variable, serial),
        serial,
      ),
      makeThrowDeadzoneExpression(variable, serial),
      serial,
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable, serial) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, serial),
        makeIntrinsicExpression("aran.record.values", serial),
        serial,
      ),
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.record.values", serial),
          makePrimitiveExpression(variable, serial),
          serial,
        ),
        serial,
      ),
      makeThrowDeadzoneExpression(variable, serial),
      serial,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, serial) =>
    makePrimitiveExpression(false, serial),
  listBindingWriteEffect: (_strict, binding, variable, right, serial) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.values", serial),
          serial,
        ),
        binding.writable
          ? makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.values", serial),
              makePrimitiveExpression(variable, serial),
              makeReadExpression(right, serial),
              serial,
            )
          : makeThrowConstantExpression(variable, serial),
        makeThrowDeadzoneExpression(variable, serial),
        serial,
      ),
      serial,
    ),
  ],
};
