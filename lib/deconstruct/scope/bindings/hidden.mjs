import {
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
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
 * @type {import("./module.d.ts").BindingModule<HiddenBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, binding, variable, tag) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, tag),
            makeIntrinsicExpression("aran.record.variables", tag),
            tag,
          ),
          makeThrowDuplicateExpression(variable, tag),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.variables", tag),
            makePrimitiveExpression(variable, tag),
            makePrimitiveExpression(binding.writable, tag),
            tag,
          ),
          tag,
        ),
        tag,
      ),
      tag,
    ),
  ],
  listBindingInitializeStatement: (
    _strict,
    _binding,
    variable,
    expression,
    tag,
  ) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values", tag),
          makePrimitiveExpression(variable, tag),
          expression,
          tag,
        ),
        tag,
      ),
      tag,
    ),
  ],
  makeBindingReadExpression: (_strict, _binding, variable, tag) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, tag),
        makeIntrinsicExpression("aran.record.values", tag),
        tag,
      ),
      makeGetExpression(
        makeIntrinsicExpression("aran.record.values", tag),
        makePrimitiveExpression(variable, tag),
        tag,
      ),
      makeThrowDeadzoneExpression(variable, tag),
      tag,
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable, tag) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, tag),
        makeIntrinsicExpression("aran.record.values", tag),
        tag,
      ),
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.record.values", tag),
          makePrimitiveExpression(variable, tag),
          tag,
        ),
        tag,
      ),
      makeThrowDeadzoneExpression(variable, tag),
      tag,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, tag) =>
    makePrimitiveExpression(false, tag),
  listBindingWriteEffect: (_strict, binding, variable, pure, tag) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, tag),
          makeIntrinsicExpression("aran.record.values", tag),
          tag,
        ),
        binding.writable
          ? makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.values", tag),
              makePrimitiveExpression(variable, tag),
              pure,
              tag,
            )
          : makeThrowConstantExpression(variable, tag),
        makeThrowDeadzoneExpression(variable, tag),
        tag,
      ),
      tag,
    ),
  ],
};
