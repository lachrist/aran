import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeApplyExpression,
  makeReadExpression,
} from "../../../node.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/** @typedef {{ type: "global" }} GlobalBinding */

/**
 * @template T
 * @type {import("./module.d.ts").BindingModule<GlobalBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, variable, tag) => [
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
          makePrimitiveExpression({ undefined: null }, tag),
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
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", tag),
            makePrimitiveExpression({ undefined: null }, tag),
            [
              makeIntrinsicExpression("aran.global", tag),
              makePrimitiveExpression(variable, tag),
              makeDataDescriptorExpression(
                expression,
                makePrimitiveExpression(true, tag),
                makePrimitiveExpression(true, tag),
                makePrimitiveExpression(false, tag),
                tag,
              ),
            ],
            tag,
          ),
          makePrimitiveExpression({ undefined: null }, tag),
          makeThrowConstantExpression(variable, tag),
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
        makeIntrinsicExpression("aran.record.variables", tag),
        tag,
      ),
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
      makeGetExpression(
        makeIntrinsicExpression("aran.global", tag),
        makePrimitiveExpression(variable, tag),
        tag,
      ),
      tag,
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable, tag) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, tag),
        makeIntrinsicExpression("aran.record.variables", tag),
        tag,
      ),
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
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.global", tag),
          makePrimitiveExpression(variable, tag),
          tag,
        ),
        tag,
      ),
      tag,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, tag) =>
    makePrimitiveExpression(false, tag),
  listBindingWriteEffect: (_strict, _binding, variable, right, tag) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, tag),
          makeIntrinsicExpression("aran.record.variables", tag),
          tag,
        ),
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, tag),
            makeIntrinsicExpression("aran.record.values", tag),
            tag,
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", tag),
            makePrimitiveExpression(variable, tag),
            makeReadExpression(right, tag),
            tag,
          ),
          makeThrowDeadzoneExpression(variable, tag),
          tag,
        ),
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global", tag),
          makePrimitiveExpression(variable, tag),
          makeReadExpression(right, tag),
          tag,
        ),
        tag,
      ),
      tag,
    ),
  ],
};
