import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeApplyExpression,
} from "../../syntax.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
} from "../../intrinsic.mjs";

import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @template T
 * @type {BindingModule<GlobalBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, variable) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable),
            makeIntrinsicExpression("aran.global.record.variables"),
          ),
          makeThrowDuplicateExpression(variable),
          makePrimitiveExpression({ undefined: null }),
        ),
      ),
    ),
  ],
  listBindingInitializeStatement: (_strict, _binding, variable, expression) => [
    makeEffectStatement(
      makeExpressionEffect(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeIntrinsicExpression("aran.global.object"),
              makePrimitiveExpression(variable),
              makeDataDescriptorExpression(
                expression,
                makePrimitiveExpression(true),
                makePrimitiveExpression(true),
                makePrimitiveExpression(false),
              ),
            ],
          ),
          makePrimitiveExpression({ undefined: null }),
          makeThrowConstantExpression(variable),
        ),
      ),
    ),
  ],
  makeBindingReadExpression: (_strict, _binding, variable) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable),
        makeIntrinsicExpression("aran.global.record.variables"),
      ),
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
      makeGetExpression(
        makeIntrinsicExpression("aran.global.object"),
        makePrimitiveExpression(variable),
      ),
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable),
        makeIntrinsicExpression("aran.global.record.variables"),
      ),
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
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.global.object"),
          makePrimitiveExpression(variable),
        ),
      ),
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable) =>
    makePrimitiveExpression(false),
  listBindingWriteEffect: (_strict, _binding, variable, pure) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.global.record.variables"),
        ),
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable),
            makeIntrinsicExpression("aran.global.record.values"),
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.global.record.values"),
            makePrimitiveExpression(variable),
            pure,
          ),
          makeThrowDeadzoneExpression(variable),
        ),
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global.object"),
          makePrimitiveExpression(variable),
          pure,
        ),
      ),
    ),
  ],
};
