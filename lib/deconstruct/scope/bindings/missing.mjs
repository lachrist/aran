import {
  makePrimitiveExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makeExpressionEffect,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeWriteEnclaveEffect,
} from "../../../syntax.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
} from "../../intrinsic.mjs";

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
  listBindingDeclareStatement: (_strict, _binding, _variable, _tag) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  listBindingInitializeStatement: (_strict, _binding, _variable, _tag) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  makeBindingReadExpression: (_strict, binding, variable, tag) =>
    binding.enclave
      ? makeReadEnclaveExpression(variable, tag)
      : makeConditionalExpression(
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
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable, tag),
              makeIntrinsicExpression("aran.global", tag),
              tag,
            ),
            makeGetExpression(
              makeIntrinsicExpression("aran.global", tag),
              makePrimitiveExpression(variable, tag),
              tag,
            ),
            makeThrowMissingExpression(variable, tag),
            tag,
          ),
          tag,
        ),
  makeBindingTypeofExpression: (_strict, binding, variable, tag) =>
    binding.enclave
      ? makeTypeofEnclaveExpression(variable, tag)
      : makeConditionalExpression(
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
  makeBindingDiscardExpression: (strict, binding, variable, tag) => {
    if ((binding.enclave, tag)) {
      reportLimitation(
        `ignoring external variable deletion ${stringifyJSON(variable)}`,
      );
      return makePrimitiveExpression(false, tag);
    } else {
      return makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, tag),
          makeIntrinsicExpression("aran.record.variables", tag),
          tag,
        ),
        makePrimitiveExpression(false, tag),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("aran.global", tag),
          makePrimitiveExpression(variable, tag),
          tag,
        ),
        tag,
      );
    }
  },
  listBindingWriteEffect: (strict, binding, variable, pure, tag) => {
    if ((binding.enclave, tag)) {
      if (!strict) {
        reportLimitation(
          `turning strict sloppy external variable assignment ${stringifyJSON(
            variable,
          )}`,
        );
      }
      return [makeWriteEnclaveEffect(variable, pure, tag)];
    } else {
      return [
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
              makeConditionalExpression(
                makeGetExpression(
                  makeIntrinsicExpression("aran.record.variables", tag),
                  makePrimitiveExpression(variable, tag),
                  tag,
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", tag),
                  makePrimitiveExpression(variable, tag),
                  pure,
                  tag,
                ),
                makeThrowConstantExpression(variable, tag),
                tag,
              ),
              makeThrowDeadzoneExpression(variable, tag),
              tag,
            ),
            strict
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "in",
                    makePrimitiveExpression(variable, tag),
                    makeIntrinsicExpression("aran.global", tag),
                    tag,
                  ),
                  makeSetExpression(
                    true,
                    makeIntrinsicExpression("aran.record.values", tag),
                    makePrimitiveExpression(variable, tag),
                    pure,
                    tag,
                  ),
                  makeThrowMissingExpression(variable, tag),
                  tag,
                )
              : makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", tag),
                  makePrimitiveExpression(variable, tag),
                  pure,
                  tag,
                ),
            tag,
          ),
          tag,
        ),
      ];
    }
  },
};
