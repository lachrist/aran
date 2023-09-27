import {
  makePrimitiveExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makeExpressionEffect,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeWriteEnclaveEffect,
  makeReadExpression,
} from "../../../node.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
} from "../../../intrinsic.mjs";

import { reportLimitation } from "../../../../limitation.mjs";

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
 * @typedef {{
 *   type: "missing";
 *   enclave: boolean;
 * }} MissingBinding
 */

/**
 * @template T
 * @type {import("./module.js").BindingModule<MissingBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => {
    throw new Error("MissingBinding.listBindingVariable");
  },
  listBindingDeclareStatement: (_strict, _binding, _variable, _serial) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  listBindingInitializeStatement: (_strict, _binding, _variable, _serial) => {
    throw new Error("MissingBinding.listBindingDeclareStatement");
  },
  makeBindingReadExpression: (_strict, binding, variable, serial) =>
    binding.enclave
      ? makeReadEnclaveExpression(variable, serial)
      : makeConditionalExpression(
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
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable, serial),
              makeIntrinsicExpression("aran.global", serial),
              serial,
            ),
            makeGetExpression(
              makeIntrinsicExpression("aran.global", serial),
              makePrimitiveExpression(variable, serial),
              serial,
            ),
            makeThrowMissingExpression(variable, serial),
            serial,
          ),
          serial,
        ),
  makeBindingTypeofExpression: (_strict, binding, variable, serial) =>
    binding.enclave
      ? makeTypeofEnclaveExpression(variable, serial)
      : makeConditionalExpression(
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
  makeBindingDiscardExpression: (strict, binding, variable, serial) => {
    if ((binding.enclave, serial)) {
      reportLimitation(
        `ignoring external variable deletion ${stringifyJSON(variable)}`,
      );
      return makePrimitiveExpression(false, serial);
    } else {
      return makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.variables", serial),
          serial,
        ),
        makePrimitiveExpression(false, serial),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("aran.global", serial),
          makePrimitiveExpression(variable, serial),
          serial,
        ),
        serial,
      );
    }
  },
  listBindingWriteEffect: (strict, binding, variable, right, serial) => {
    if ((binding.enclave, serial)) {
      if (!strict) {
        reportLimitation(
          `turning strict sloppy external variable assignment ${stringifyJSON(
            variable,
          )}`,
        );
      }
      return [
        makeWriteEnclaveEffect(
          variable,
          makeReadExpression(right, serial),
          serial,
        ),
      ];
    } else {
      return [
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
              makeConditionalExpression(
                makeGetExpression(
                  makeIntrinsicExpression("aran.record.variables", serial),
                  makePrimitiveExpression(variable, serial),
                  serial,
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", serial),
                  makePrimitiveExpression(variable, serial),
                  makeReadExpression(right, serial),
                  serial,
                ),
                makeThrowConstantExpression(variable, serial),
                serial,
              ),
              makeThrowDeadzoneExpression(variable, serial),
              serial,
            ),
            strict
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "in",
                    makePrimitiveExpression(variable, serial),
                    makeIntrinsicExpression("aran.global", serial),
                    serial,
                  ),
                  makeSetExpression(
                    true,
                    makeIntrinsicExpression("aran.record.values", serial),
                    makePrimitiveExpression(variable, serial),
                    makeReadExpression(right, serial),
                    serial,
                  ),
                  makeThrowMissingExpression(variable, serial),
                  serial,
                )
              : makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", serial),
                  makePrimitiveExpression(variable, serial),
                  makeReadExpression(right, serial),
                  serial,
                ),
            serial,
          ),
          serial,
        ),
      ];
    }
  },
};
