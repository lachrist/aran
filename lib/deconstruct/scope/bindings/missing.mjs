import {
  makePrimitiveExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makeExpressionEffect,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../../syntax.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
} from "../../../intrinsic.mjs";

import { reportLimitation } from "../../../limitation.mjs";

import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";

const {
  Error,
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @template T
 * @type {BindingModule<MissingBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => {
    throw new Error("MissingBinding.listBindingVariable");
  },
  listBindingDeclareStatement: (_strict, _binding, _variable) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  listBindingInitializeStatement: (_strict, _binding, _variable) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  makeBindingReadExpression: (_strict, binding, variable) =>
    binding.enclave
      ? makeReadExternalExpression(variable)
      : makeConditionalExpression(
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
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable),
              makeIntrinsicExpression("aran.global.object"),
            ),
            makeGetExpression(
              makeIntrinsicExpression("aran.global.object"),
              makePrimitiveExpression(variable),
            ),
            makeThrowMissingExpression(variable),
          ),
        ),
  makeBindingTypeofExpression: (_strict, binding, variable) =>
    binding.enclave
      ? makeTypeofExternalExpression(variable)
      : makeConditionalExpression(
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
          makeUnaryExpression(
            "typeof",
            makeGetExpression(
              makeIntrinsicExpression("aran.global.object"),
              makePrimitiveExpression(variable),
            ),
          ),
        ),
  makeBindingDiscardExpression: (strict, binding, variable) => {
    if (binding.enclave) {
      reportLimitation(
        `ignoring external variable deletion ${stringifyJSON(variable)}`,
      );
      return makePrimitiveExpression(false);
    } else {
      return makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.global.record.variables"),
        ),
        makePrimitiveExpression(false),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("aran.global.object"),
          makePrimitiveExpression(variable),
        ),
      );
    }
  },
  listBindingWriteEffect: (strict, binding, variable, pure) => {
    if (binding.enclave) {
      if (!strict) {
        reportLimitation(
          `turning strict sloppy external variable assignment ${stringifyJSON(
            variable,
          )}`,
        );
      }
      return [makeWriteExternalEffect(variable, pure)];
    } else {
      return [
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
              makeConditionalExpression(
                makeGetExpression(
                  makeIntrinsicExpression("aran.global.record.variables"),
                  makePrimitiveExpression(variable),
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.global.record.values"),
                  makePrimitiveExpression(variable),
                  pure,
                ),
                makeThrowConstantExpression(variable),
              ),
              makeThrowDeadzoneExpression(variable),
            ),
            strict
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "in",
                    makePrimitiveExpression(variable),
                    makeIntrinsicExpression("aran.global.object"),
                  ),
                  makeSetExpression(
                    true,
                    makeIntrinsicExpression("aran.global.record.values"),
                    makePrimitiveExpression(variable),
                    pure,
                  ),
                  makeThrowMissingExpression(variable),
                )
              : makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.global.record.values"),
                  makePrimitiveExpression(variable),
                  pure,
                ),
          ),
        ),
      ];
    }
  },
};
