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
 * @type {import("./module.js").BindingModule<GlobalBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, variable, serial) => [
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
          makePrimitiveExpression({ undefined: null }, serial),
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
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeIntrinsicExpression("aran.global", serial),
              makePrimitiveExpression(variable, serial),
              makeDataDescriptorExpression(
                expression,
                makePrimitiveExpression(true, serial),
                makePrimitiveExpression(true, serial),
                makePrimitiveExpression(false, serial),
                serial,
              ),
            ],
            serial,
          ),
          makePrimitiveExpression({ undefined: null }, serial),
          makeThrowConstantExpression(variable, serial),
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
        makeIntrinsicExpression("aran.record.variables", serial),
        serial,
      ),
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
      makeGetExpression(
        makeIntrinsicExpression("aran.global", serial),
        makePrimitiveExpression(variable, serial),
        serial,
      ),
      serial,
    ),
  makeBindingTypeofExpression: (_strict, _binding, variable, serial) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, serial),
        makeIntrinsicExpression("aran.record.variables", serial),
        serial,
      ),
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
      makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeIntrinsicExpression("aran.global", serial),
          makePrimitiveExpression(variable, serial),
          serial,
        ),
        serial,
      ),
      serial,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, serial) =>
    makePrimitiveExpression(false, serial),
  listBindingWriteEffect: (_strict, _binding, variable, right, serial) => [
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.variables", serial),
          serial,
        ),
        makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, serial),
            makeIntrinsicExpression("aran.record.values", serial),
            serial,
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", serial),
            makePrimitiveExpression(variable, serial),
            makeReadExpression(right, serial),
            serial,
          ),
          makeThrowDeadzoneExpression(variable, serial),
          serial,
        ),
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global", serial),
          makePrimitiveExpression(variable, serial),
          makeReadExpression(right, serial),
          serial,
        ),
        serial,
      ),
      serial,
    ),
  ],
};
